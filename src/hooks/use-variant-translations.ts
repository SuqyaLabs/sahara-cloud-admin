'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VariantTranslation, VariantTranslationInput } from '@/types/database'

interface UseVariantTranslationsReturn {
  translations: VariantTranslation[]
  isLoading: boolean
  error: string | null
  fetchTranslations: (variantId: string) => Promise<VariantTranslation[]>
  fetchAllForProduct: (productId: string) => Promise<Record<string, VariantTranslation[]>>
  getTranslation: (variantId: string, languageCode: string) => Promise<VariantTranslation | null>
  upsertTranslation: (data: VariantTranslationInput) => Promise<VariantTranslation | null>
  upsertAllTranslations: (variantId: string, translations: Record<string, { name: string }>) => Promise<boolean>
  deleteTranslation: (variantId: string, languageCode: string) => Promise<boolean>
}

export function useVariantTranslations(): UseVariantTranslationsReturn {
  const [translations, setTranslations] = useState<VariantTranslation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTranslations = useCallback(async (variantId: string): Promise<VariantTranslation[]> => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error: queryError } = await supabase
        .from('variant_translations')
        .select('*')
        .eq('variant_id', variantId)
        .order('language_code')

      if (queryError) {
        setError('Error loading variant translations')
        console.error(queryError)
        setIsLoading(false)
        return []
      }

      const result = (data as VariantTranslation[]) || []
      setTranslations(result)
      setIsLoading(false)
      return result
    } catch (err) {
      setError('Unexpected error')
      console.error(err)
      setIsLoading(false)
      return []
    }
  }, [])

  const fetchAllForProduct = useCallback(async (productId: string): Promise<Record<string, VariantTranslation[]>> => {
    const supabase = createClient()

    try {
      // First get all variant IDs for this product
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: variants, error: variantError } = await (supabase as any)
        .from('variants')
        .select('id')
        .eq('product_id', productId)

      if (variantError || !variants) {
        console.error('Error fetching variants:', variantError)
        return {}
      }

      const variantIds = (variants as { id: string }[]).map(v => v.id)
      if (variantIds.length === 0) return {}

      // Then get all translations for those variants
      const { data, error: queryError } = await supabase
        .from('variant_translations')
        .select('*')
        .in('variant_id', variantIds)
        .order('language_code')

      if (queryError) {
        console.error('Error fetching variant translations:', queryError)
        return {}
      }

      // Group by variant_id
      const grouped: Record<string, VariantTranslation[]> = {}
      ;(data as VariantTranslation[] || []).forEach(t => {
        if (!grouped[t.variant_id]) {
          grouped[t.variant_id] = []
        }
        grouped[t.variant_id].push(t)
      })

      return grouped
    } catch (err) {
      console.error('Unexpected error:', err)
      return {}
    }
  }, [])

  const getTranslation = useCallback(async (variantId: string, languageCode: string): Promise<VariantTranslation | null> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('variant_translations')
      .select('*')
      .eq('variant_id', variantId)
      .eq('language_code', languageCode)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching variant translation:', error)
      }
      return null
    }

    return data as VariantTranslation
  }, [])

  const upsertTranslation = useCallback(async (data: VariantTranslationInput): Promise<VariantTranslation | null> => {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error } = await (supabase as any)
      .from('variant_translations')
      .upsert({
        variant_id: data.variant_id,
        language_code: data.language_code,
        name: data.name,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'variant_id,language_code',
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting variant translation:', error)
      return null
    }

    setTranslations(prev => {
      const index = prev.findIndex(
        t => t.variant_id === data.variant_id && t.language_code === data.language_code
      )
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = result as VariantTranslation
        return updated
      }
      return [...prev, result as VariantTranslation]
    })

    return result as VariantTranslation
  }, [])

  const upsertAllTranslations = useCallback(async (
    variantId: string,
    translationsMap: Record<string, { name: string }>
  ): Promise<boolean> => {
    const supabase = createClient()

    const upsertData = Object.entries(translationsMap)
      .filter(([, trans]) => trans.name?.trim())
      .map(([langCode, trans]) => ({
        variant_id: variantId,
        language_code: langCode,
        name: trans.name,
        updated_at: new Date().toISOString(),
      }))

    if (upsertData.length === 0) return true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('variant_translations')
      .upsert(upsertData, {
        onConflict: 'variant_id,language_code',
      })
      .select()

    if (error) {
      console.error('Error upserting variant translations:', error)
      return false
    }

    setTranslations(data as VariantTranslation[])
    return true
  }, [])

  const deleteTranslation = useCallback(async (variantId: string, languageCode: string): Promise<boolean> => {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('variant_translations')
      .delete()
      .eq('variant_id', variantId)
      .eq('language_code', languageCode)

    if (error) {
      console.error('Error deleting variant translation:', error)
      return false
    }

    setTranslations(prev => prev.filter(
      t => !(t.variant_id === variantId && t.language_code === languageCode)
    ))
    
    return true
  }, [])

  return {
    translations,
    isLoading,
    error,
    fetchTranslations,
    fetchAllForProduct,
    getTranslation,
    upsertTranslation,
    upsertAllTranslations,
    deleteTranslation,
  }
}
