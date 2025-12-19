'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ProductTranslation, ProductTranslationInput } from '@/types/database'

interface UseProductTranslationsReturn {
  translations: ProductTranslation[]
  isLoading: boolean
  error: string | null
  fetchTranslations: (productId: string) => Promise<ProductTranslation[]>
  getTranslation: (productId: string, languageCode: string) => Promise<ProductTranslation | null>
  upsertTranslation: (data: ProductTranslationInput) => Promise<ProductTranslation | null>
  upsertAllTranslations: (productId: string, translations: Record<string, Partial<ProductTranslationInput>>) => Promise<boolean>
  deleteTranslation: (productId: string, languageCode: string) => Promise<boolean>
}

export function useProductTranslations(): UseProductTranslationsReturn {
  const [translations, setTranslations] = useState<ProductTranslation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTranslations = useCallback(async (productId: string): Promise<ProductTranslation[]> => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error: queryError } = await supabase
        .from('product_translations')
        .select('*')
        .eq('product_id', productId)
        .order('language_code')

      if (queryError) {
        setError('Erreur lors du chargement des traductions')
        console.error(queryError)
        setIsLoading(false)
        return []
      }

      const result = (data as ProductTranslation[]) || []
      setTranslations(result)
      setIsLoading(false)
      return result
    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
      setIsLoading(false)
      return []
    }
  }, [])

  const getTranslation = useCallback(async (productId: string, languageCode: string): Promise<ProductTranslation | null> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('product_translations')
      .select('*')
      .eq('product_id', productId)
      .eq('language_code', languageCode)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching translation:', error)
      }
      return null
    }

    return data as ProductTranslation
  }, [])

  const upsertTranslation = useCallback(async (data: ProductTranslationInput): Promise<ProductTranslation | null> => {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error } = await (supabase as any)
      .from('product_translations')
      .upsert({
        product_id: data.product_id,
        language_code: data.language_code,
        name: data.name,
        short_description: data.short_description,
        long_description: data.long_description,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'product_id,language_code',
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting translation:', error)
      return null
    }

    setTranslations(prev => {
      const index = prev.findIndex(
        t => t.product_id === data.product_id && t.language_code === data.language_code
      )
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = result as ProductTranslation
        return updated
      }
      return [...prev, result as ProductTranslation]
    })

    return result as ProductTranslation
  }, [])

  const upsertAllTranslations = useCallback(async (
    productId: string,
    translationsMap: Record<string, Partial<ProductTranslationInput>>
  ): Promise<boolean> => {
    const supabase = createClient()

    const upsertData = Object.entries(translationsMap).map(([langCode, trans]) => ({
      product_id: productId,
      language_code: langCode,
      name: trans.name || '',
      short_description: trans.short_description || null,
      long_description: trans.long_description || null,
      seo_title: trans.seo_title || null,
      seo_description: trans.seo_description || null,
      updated_at: new Date().toISOString(),
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('product_translations')
      .upsert(upsertData, {
        onConflict: 'product_id,language_code',
      })
      .select()

    if (error) {
      console.error('Error upserting translations:', error)
      return false
    }

    setTranslations(data as ProductTranslation[])
    return true
  }, [])

  const deleteTranslation = useCallback(async (productId: string, languageCode: string): Promise<boolean> => {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('product_translations')
      .delete()
      .eq('product_id', productId)
      .eq('language_code', languageCode)

    if (error) {
      console.error('Error deleting translation:', error)
      return false
    }

    setTranslations(prev => prev.filter(
      t => !(t.product_id === productId && t.language_code === languageCode)
    ))
    
    return true
  }, [])

  return {
    translations,
    isLoading,
    error,
    fetchTranslations,
    getTranslation,
    upsertTranslation,
    upsertAllTranslations,
    deleteTranslation,
  }
}
