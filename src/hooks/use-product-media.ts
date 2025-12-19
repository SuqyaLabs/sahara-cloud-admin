'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'product-media'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Interface matching the product_media table schema
export interface ProductMedia {
  id: string
  product_id: string
  storage_bucket: string
  storage_path: string
  position: number
  alt_text: string | null
  is_primary: boolean
  created_at: string
  // Computed field
  url: string
}

interface UseProductMediaReturn {
  isUploading: boolean
  uploadProgress: number
  error: string | null
  // Fetch images from product_media table
  fetchProductMedia: (productId: string) => Promise<ProductMedia[]>
  // Upload file and insert into product_media table
  uploadAndInsert: (params: {
    file: File
    tenantId: string
    productId: string
    makePrimary?: boolean
    position?: number
    altText?: string
  }) => Promise<ProductMedia | null>
  // Upload multiple files
  uploadMultiple: (params: {
    files: File[]
    tenantId: string
    productId: string
  }) => Promise<ProductMedia[]>
  // Delete from storage and product_media table
  deleteMedia: (media: ProductMedia) => Promise<boolean>
  // Update position/primary in product_media table
  setPrimary: (productId: string, mediaId: string) => Promise<boolean>
  updatePositions: (updates: { id: string; position: number }[]) => Promise<boolean>
  // Utilities
  getPublicUrl: (storagePath: string) => string
  validateFile: (file: File) => { valid: boolean; error?: string }
}

export function useProductMedia(): UseProductMediaReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `Type de fichier non supporté. Utilisez: JPG, PNG, WebP ou GIF` 
      }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `Fichier trop volumineux. Maximum: 5MB` 
      }
    }
    return { valid: true }
  }, [])

  const getPublicUrl = useCallback((storagePath: string): string => {
    const supabase = createClient()
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
    return data.publicUrl
  }, [])

  // Fetch all media for a product from product_media table
  const fetchProductMedia = useCallback(async (productId: string): Promise<ProductMedia[]> => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Fetch product media error:', error)
      return []
    }

    // Add computed URL field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data || []) as any[]).map(row => ({
      id: row.id,
      product_id: row.product_id,
      storage_bucket: row.storage_bucket,
      storage_path: row.storage_path,
      position: row.position,
      alt_text: row.alt_text,
      is_primary: row.is_primary,
      created_at: row.created_at,
      url: getPublicUrl(row.storage_path),
    }))
  }, [getPublicUrl])

  // Upload file to storage and insert row into product_media table
  const uploadAndInsert = useCallback(async (params: {
    file: File
    tenantId: string
    productId: string
    makePrimary?: boolean
    position?: number
    altText?: string
  }): Promise<ProductMedia | null> => {
    const { file, tenantId, productId, makePrimary = false, position = 0, altText = null } = params

    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide')
      return null
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    const supabase = createClient()
    
    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const storagePath = `${tenantId}/${productId}/${filename}`

    try {
      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Erreur lors du téléchargement')
        return null
      }

      setUploadProgress(50)

      // 2. If making primary, unset other primaries first
      if (makePrimary) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('product_media') as any)
          .update({ is_primary: false })
          .eq('product_id', productId)
      }

      // 3. Insert into product_media table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = await (supabase.from('product_media') as any)
        .insert({
          product_id: productId,
          storage_bucket: BUCKET_NAME,
          storage_path: storagePath,
          position,
          alt_text: altText,
          is_primary: makePrimary,
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('Insert product_media error:', insertError)
        // Try to clean up the uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([storagePath])
        setError('Erreur lors de l\'enregistrement')
        return null
      }

      setUploadProgress(100)
      
      return {
        id: data.id,
        product_id: data.product_id,
        storage_bucket: data.storage_bucket,
        storage_path: data.storage_path,
        position: data.position,
        alt_text: data.alt_text,
        is_primary: data.is_primary,
        created_at: data.created_at,
        url: getPublicUrl(storagePath),
      }
    } catch (err) {
      console.error('Upload exception:', err)
      setError('Erreur inattendue lors du téléchargement')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [validateFile, getPublicUrl])

  // Upload multiple files
  const uploadMultiple = useCallback(async (params: {
    files: File[]
    tenantId: string
    productId: string
  }): Promise<ProductMedia[]> => {
    const { files, tenantId, productId } = params
    const results: ProductMedia[] = []
    
    // Get current count to determine positions and primary status
    const existing = await fetchProductMedia(productId)
    const startPosition = existing.length
    const needsPrimary = existing.length === 0

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(Math.round((i / files.length) * 100))
      
      const result = await uploadAndInsert({
        file: files[i],
        tenantId,
        productId,
        makePrimary: needsPrimary && i === 0,
        position: startPosition + i,
      })
      
      if (result) {
        results.push(result)
      }
    }
    
    setUploadProgress(100)
    return results
  }, [fetchProductMedia, uploadAndInsert])

  // Delete from storage and product_media table
  const deleteMedia = useCallback(async (media: ProductMedia): Promise<boolean> => {
    const supabase = createClient()
    
    try {
      // 1. Delete from product_media table
      const { error: dbError } = await supabase
        .from('product_media')
        .delete()
        .eq('id', media.id)

      if (dbError) {
        console.error('Delete product_media error:', dbError)
        setError('Erreur lors de la suppression')
        return false
      }

      // 2. Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([media.storage_path])

      if (storageError) {
        console.error('Delete storage error:', storageError)
        // Don't fail - the DB record is already deleted
      }

      return true
    } catch (err) {
      console.error('Delete exception:', err)
      setError('Erreur inattendue lors de la suppression')
      return false
    }
  }, [])

  // Set primary image
  const setPrimary = useCallback(async (productId: string, mediaId: string): Promise<boolean> => {
    const supabase = createClient()
    
    try {
      // 1. Unset all primaries for this product
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('product_media') as any)
        .update({ is_primary: false })
        .eq('product_id', productId)

      // 2. Set the specified one as primary
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('product_media') as any)
        .update({ is_primary: true })
        .eq('id', mediaId)

      if (error) {
        console.error('Set primary error:', error)
        setError('Erreur lors de la mise à jour')
        return false
      }

      return true
    } catch (err) {
      console.error('Set primary exception:', err)
      setError('Erreur inattendue')
      return false
    }
  }, [])

  // Update positions for multiple media items
  const updatePositions = useCallback(async (updates: { id: string; position: number }[]): Promise<boolean> => {
    const supabase = createClient()
    
    try {
      for (const update of updates) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('product_media') as any)
          .update({ position: update.position })
          .eq('id', update.id)

        if (error) {
          console.error('Update position error:', error)
          setError('Erreur lors de la mise à jour')
          return false
        }
      }

      return true
    } catch (err) {
      console.error('Update positions exception:', err)
      setError('Erreur inattendue')
      return false
    }
  }, [])

  return {
    isUploading,
    uploadProgress,
    error,
    fetchProductMedia,
    uploadAndInsert,
    uploadMultiple,
    deleteMedia,
    setPrimary,
    updatePositions,
    getPublicUrl,
    validateFile,
  }
}
