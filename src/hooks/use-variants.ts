'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Variant } from '@/types/database'

interface UseVariantsReturn {
  variants: Variant[]
  isLoading: boolean
  error: string | null
  fetchVariants: (productId: string) => Promise<void>
  createVariant: (data: CreateVariantData) => Promise<Variant | null>
  updateVariant: (id: string, data: UpdateVariantData) => Promise<boolean>
  deleteVariant: (id: string) => Promise<boolean>
}

interface CreateVariantData {
  product_id: string
  tenant_id: string
  name: string
  price_mod?: number
  barcode?: string | null
  sku?: string | null
  track_stock?: boolean
}

interface UpdateVariantData {
  name?: string
  price_mod?: number
  barcode?: string | null
  sku?: string | null
  track_stock?: boolean
}

export function useVariants(): UseVariantsReturn {
  const [variants, setVariants] = useState<Variant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVariants = useCallback(async (productId: string) => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error: queryError } = await supabase
        .from('variants')
        .select('*')
        .eq('product_id', productId)
        .order('name')

      if (queryError) {
        setError('Erreur lors du chargement des variantes')
        console.error(queryError)
      } else {
        setVariants((data as Variant[]) || [])
      }
    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsLoading(false)
  }, [])

  const createVariant = useCallback(async (data: CreateVariantData): Promise<Variant | null> => {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newVariant, error } = await (supabase as any)
      .from('variants')
      .insert({
        tenant_id: data.tenant_id,
        product_id: data.product_id,
        name: data.name,
        price_mod: data.price_mod || 0,
        barcode: data.barcode || null,
        sku: data.sku || null,
        track_stock: data.track_stock || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating variant:', error)
      setError('Erreur lors de la création de la variante')
      return null
    }

    setVariants(prev => [...prev, newVariant as Variant].sort((a, b) => a.name.localeCompare(b.name)))
    return newVariant as Variant
  }, [])

  const updateVariant = useCallback(async (id: string, data: UpdateVariantData): Promise<boolean> => {
    const supabase = createClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.price_mod !== undefined) updateData.price_mod = data.price_mod
    if (data.barcode !== undefined) updateData.barcode = data.barcode
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.track_stock !== undefined) updateData.track_stock = data.track_stock

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('variants')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating variant:', error)
      setError('Erreur lors de la mise à jour de la variante')
      return false
    }

    setVariants(prev => prev.map(v => 
      v.id === id ? { ...v, ...updateData } as Variant : v
    ).sort((a, b) => a.name.localeCompare(b.name)))
    
    return true
  }, [])

  const deleteVariant = useCallback(async (id: string): Promise<boolean> => {
    const supabase = createClient()

    const { error } = await supabase
      .from('variants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting variant:', error)
      setError('Erreur lors de la suppression de la variante')
      return false
    }

    setVariants(prev => prev.filter(v => v.id !== id))
    return true
  }, [])

  return {
    variants,
    isLoading,
    error,
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
  }
}
