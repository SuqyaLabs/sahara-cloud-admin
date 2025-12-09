'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/types/database'

interface UseProductsFilters {
  categoryId?: string
  search?: string
  isAvailable?: boolean
}

interface UseProductsReturn {
  products: Product[]
  categories: Category[]
  totalCount: number
  isLoading: boolean
  error: string | null
  page: number
  pageSize: number
  setPage: (page: number) => void
  setFilters: (filters: UseProductsFilters) => void
  filters: UseProductsFilters
  refresh: () => Promise<void>
  toggleAvailability: (productId: string, isAvailable: boolean) => Promise<void>
}

export function useProducts(tenantId: string | null): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<UseProductsFilters>({})
  const pageSize = 25

  const fetchCategories = useCallback(async () => {
    if (!tenantId) return

    const supabase = createClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')

    setCategories((data as Category[]) || [])
  }, [tenantId])

  const fetchProducts = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('name')

      // Apply filters
      if (filters.categoryId && filters.categoryId !== 'all') {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters.isAvailable !== undefined) {
        query = query.eq('is_available', filters.isAvailable)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, count, error: queryError } = await query

      if (queryError) {
        setError('Erreur lors du chargement des produits')
        console.error(queryError)
      } else {
        setProducts((data as Product[]) || [])
        setTotalCount(count || 0)
      }
    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsLoading(false)
  }, [tenantId, page, filters])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const toggleAvailability = useCallback(async (productId: string, isAvailable: boolean) => {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('products')
      .update({ is_available: isAvailable })
      .eq('id', productId)

    if (error) {
      console.error('Error updating availability:', error)
      return
    }

    // Update local state
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, is_available: isAvailable } : p
    ))
  }, [])

  return {
    products,
    categories,
    totalCount,
    isLoading,
    error,
    page,
    pageSize,
    setPage,
    setFilters,
    filters,
    refresh: fetchProducts,
    toggleAvailability,
  }
}
