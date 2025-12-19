'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Language } from '@/types/database'

interface UseLanguagesReturn {
  languages: Language[]
  activeLanguages: Language[]
  defaultLanguage: Language | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateLanguage: (code: string, data: Partial<Language>) => Promise<boolean>
  setDefaultLanguage: (code: string) => Promise<boolean>
}

export function useLanguages(): UseLanguagesReturn {
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLanguages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error: queryError } = await supabase
        .from('languages')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name')

      if (queryError) {
        setError('Erreur lors du chargement des langues')
        console.error(queryError)
      } else {
        setLanguages((data as Language[]) || [])
      }
    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchLanguages()
  }, [fetchLanguages])

  const updateLanguage = useCallback(async (code: string, data: Partial<Language>): Promise<boolean> => {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('languages')
      .update(data)
      .eq('code', code)

    if (error) {
      console.error('Error updating language:', error)
      return false
    }

    setLanguages(prev => prev.map(l => 
      l.code === code ? { ...l, ...data } : l
    ))
    
    return true
  }, [])

  const setDefaultLanguage = useCallback(async (code: string): Promise<boolean> => {
    const supabase = createClient()

    // First, unset all defaults
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: resetError } = await (supabase as any)
      .from('languages')
      .update({ is_default: false })
      .neq('code', code)

    if (resetError) {
      console.error('Error resetting default language:', resetError)
      return false
    }

    // Then set the new default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('languages')
      .update({ is_default: true })
      .eq('code', code)

    if (error) {
      console.error('Error setting default language:', error)
      return false
    }

    setLanguages(prev => prev.map(l => ({
      ...l,
      is_default: l.code === code
    })))
    
    return true
  }, [])

  const activeLanguages = languages.filter(l => l.is_active)
  const defaultLanguage = languages.find(l => l.is_default) || null

  return {
    languages,
    activeLanguages,
    defaultLanguage,
    isLoading,
    error,
    refresh: fetchLanguages,
    updateLanguage,
    setDefaultLanguage,
  }
}
