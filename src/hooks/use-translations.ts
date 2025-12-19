'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'
import type { 
  LanguageCode, 
  ProductTranslation, 
  CategoryTranslation, 
  VariantTranslation 
} from '@/lib/i18n/types'

interface UseTranslationsReturn {
  // Product translations
  getProductTranslation: (productId: string, langCode?: LanguageCode) => Promise<ProductTranslation | null>
  getProductTranslations: (productId: string) => Promise<ProductTranslation[]>
  upsertProductTranslation: (translation: Omit<ProductTranslation, 'id'>) => Promise<boolean>
  deleteProductTranslation: (productId: string, langCode: LanguageCode) => Promise<boolean>
  
  // Category translations
  getCategoryTranslation: (categoryId: string, langCode?: LanguageCode) => Promise<CategoryTranslation | null>
  getCategoryTranslations: (categoryId: string) => Promise<CategoryTranslation[]>
  upsertCategoryTranslation: (translation: Omit<CategoryTranslation, 'id'>) => Promise<boolean>
  deleteCategoryTranslation: (categoryId: string, langCode: LanguageCode) => Promise<boolean>
  
  // Variant translations
  getVariantTranslation: (variantId: string, langCode?: LanguageCode) => Promise<VariantTranslation | null>
  getVariantTranslations: (variantId: string) => Promise<VariantTranslation[]>
  upsertVariantTranslation: (translation: Omit<VariantTranslation, 'id'>) => Promise<boolean>
  deleteVariantTranslation: (variantId: string, langCode: LanguageCode) => Promise<boolean>
  
  // Bulk operations
  getProductsWithTranslations: (productIds: string[], langCode?: LanguageCode) => Promise<Map<string, ProductTranslation>>
  getCategoriesWithTranslations: (categoryIds: string[], langCode?: LanguageCode) => Promise<Map<string, CategoryTranslation>>
  
  isLoading: boolean
  error: string | null
}

export function useTranslations(): UseTranslationsReturn {
  const { currentLanguage } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Product translations
  const getProductTranslation = useCallback(async (
    productId: string, 
    langCode?: LanguageCode
  ): Promise<ProductTranslation | null> => {
    const supabase = createClient()
    const lang = langCode || currentLanguage
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('product_translations') as any)
      .select('*')
      .eq('product_id', productId)
      .eq('language_code', lang)
      .single()

    if (error) {
      // If no translation found, try French as fallback
      if (lang !== 'fr') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: frData } = await (supabase.from('product_translations') as any)
          .select('*')
          .eq('product_id', productId)
          .eq('language_code', 'fr')
          .single()
        return frData || null
      }
      return null
    }
    return data
  }, [currentLanguage])

  const getProductTranslations = useCallback(async (productId: string): Promise<ProductTranslation[]> => {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('product_translations') as any)
      .select('*')
      .eq('product_id', productId)
      .order('language_code')

    if (error) {
      console.error('Error fetching product translations:', error)
      return []
    }
    return data || []
  }, [])

  const upsertProductTranslation = useCallback(async (
    translation: Omit<ProductTranslation, 'id'>
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('product_translations') as any)
        .upsert({
          product_id: translation.product_id,
          language_code: translation.language_code,
          name: translation.name,
          short_description: translation.short_description,
          long_description: translation.long_description,
          seo_title: translation.seo_title,
          seo_description: translation.seo_description,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'product_id,language_code'
        })

      if (error) {
        setError(error.message)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to save translation')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteProductTranslation = useCallback(async (
    productId: string, 
    langCode: LanguageCode
  ): Promise<boolean> => {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('product_translations') as any)
      .delete()
      .eq('product_id', productId)
      .eq('language_code', langCode)

    return !error
  }, [])

  // Category translations
  const getCategoryTranslation = useCallback(async (
    categoryId: string, 
    langCode?: LanguageCode
  ): Promise<CategoryTranslation | null> => {
    const supabase = createClient()
    const lang = langCode || currentLanguage
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('category_translations') as any)
      .select('*')
      .eq('category_id', categoryId)
      .eq('language_code', lang)
      .single()

    if (error) {
      if (lang !== 'fr') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: frData } = await (supabase.from('category_translations') as any)
          .select('*')
          .eq('category_id', categoryId)
          .eq('language_code', 'fr')
          .single()
        return frData || null
      }
      return null
    }
    return data
  }, [currentLanguage])

  const getCategoryTranslations = useCallback(async (categoryId: string): Promise<CategoryTranslation[]> => {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('category_translations') as any)
      .select('*')
      .eq('category_id', categoryId)
      .order('language_code')

    if (error) {
      console.error('Error fetching category translations:', error)
      return []
    }
    return data || []
  }, [])

  const upsertCategoryTranslation = useCallback(async (
    translation: Omit<CategoryTranslation, 'id'>
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('category_translations') as any)
        .upsert({
          category_id: translation.category_id,
          language_code: translation.language_code,
          name: translation.name,
          description: translation.description,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'category_id,language_code'
        })

      if (error) {
        setError(error.message)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to save translation')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteCategoryTranslation = useCallback(async (
    categoryId: string, 
    langCode: LanguageCode
  ): Promise<boolean> => {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('category_translations') as any)
      .delete()
      .eq('category_id', categoryId)
      .eq('language_code', langCode)

    return !error
  }, [])

  // Variant translations
  const getVariantTranslation = useCallback(async (
    variantId: string, 
    langCode?: LanguageCode
  ): Promise<VariantTranslation | null> => {
    const supabase = createClient()
    const lang = langCode || currentLanguage
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('variant_translations') as any)
      .select('*')
      .eq('variant_id', variantId)
      .eq('language_code', lang)
      .single()

    if (error) {
      if (lang !== 'fr') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: frData } = await (supabase.from('variant_translations') as any)
          .select('*')
          .eq('variant_id', variantId)
          .eq('language_code', 'fr')
          .single()
        return frData || null
      }
      return null
    }
    return data
  }, [currentLanguage])

  const getVariantTranslations = useCallback(async (variantId: string): Promise<VariantTranslation[]> => {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('variant_translations') as any)
      .select('*')
      .eq('variant_id', variantId)
      .order('language_code')

    if (error) {
      console.error('Error fetching variant translations:', error)
      return []
    }
    return data || []
  }, [])

  const upsertVariantTranslation = useCallback(async (
    translation: Omit<VariantTranslation, 'id'>
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('variant_translations') as any)
        .upsert({
          variant_id: translation.variant_id,
          language_code: translation.language_code,
          name: translation.name,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'variant_id,language_code'
        })

      if (error) {
        setError(error.message)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to save translation')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteVariantTranslation = useCallback(async (
    variantId: string, 
    langCode: LanguageCode
  ): Promise<boolean> => {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('variant_translations') as any)
      .delete()
      .eq('variant_id', variantId)
      .eq('language_code', langCode)

    return !error
  }, [])

  // Bulk operations
  const getProductsWithTranslations = useCallback(async (
    productIds: string[], 
    langCode?: LanguageCode
  ): Promise<Map<string, ProductTranslation>> => {
    if (productIds.length === 0) return new Map()
    
    const supabase = createClient()
    const lang = langCode || currentLanguage
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('product_translations') as any)
      .select('*')
      .in('product_id', productIds)
      .eq('language_code', lang)

    const map = new Map<string, ProductTranslation>()
    if (data) {
      for (const item of data) {
        map.set(item.product_id, item)
      }
    }
    
    // Fetch French fallback for missing translations
    const missingIds = productIds.filter(id => !map.has(id))
    if (missingIds.length > 0 && lang !== 'fr') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: frData } = await (supabase.from('product_translations') as any)
        .select('*')
        .in('product_id', missingIds)
        .eq('language_code', 'fr')
      
      if (frData) {
        for (const item of frData) {
          if (!map.has(item.product_id)) {
            map.set(item.product_id, item)
          }
        }
      }
    }
    
    return map
  }, [currentLanguage])

  const getCategoriesWithTranslations = useCallback(async (
    categoryIds: string[], 
    langCode?: LanguageCode
  ): Promise<Map<string, CategoryTranslation>> => {
    if (categoryIds.length === 0) return new Map()
    
    const supabase = createClient()
    const lang = langCode || currentLanguage
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('category_translations') as any)
      .select('*')
      .in('category_id', categoryIds)
      .eq('language_code', lang)

    const map = new Map<string, CategoryTranslation>()
    if (data) {
      for (const item of data) {
        map.set(item.category_id, item)
      }
    }
    
    // Fetch French fallback for missing translations
    const missingIds = categoryIds.filter(id => !map.has(id))
    if (missingIds.length > 0 && lang !== 'fr') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: frData } = await (supabase.from('category_translations') as any)
        .select('*')
        .in('category_id', missingIds)
        .eq('language_code', 'fr')
      
      if (frData) {
        for (const item of frData) {
          if (!map.has(item.category_id)) {
            map.set(item.category_id, item)
          }
        }
      }
    }
    
    return map
  }, [currentLanguage])

  return {
    getProductTranslation,
    getProductTranslations,
    upsertProductTranslation,
    deleteProductTranslation,
    getCategoryTranslation,
    getCategoryTranslations,
    upsertCategoryTranslation,
    deleteCategoryTranslation,
    getVariantTranslation,
    getVariantTranslations,
    upsertVariantTranslation,
    deleteVariantTranslation,
    getProductsWithTranslations,
    getCategoriesWithTranslations,
    isLoading,
    error,
  }
}
