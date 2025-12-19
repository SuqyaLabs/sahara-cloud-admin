'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/types/database'

interface UseProductsFilters {
  categoryId?: string
  search?: string
  isAvailable?: boolean
}

interface CreateProductData {
  name: string
  price: number
  type?: 'simple' | 'variable' | 'composite'
  category_id?: string | null
  barcode?: string | null
  sku?: string | null
  cost_price?: number
  is_available?: boolean
  track_stock?: boolean
  brand?: string | null
  short_description?: string | null
  printer_dest?: 'kitchen' | 'bar' | 'oven' | null
}

interface UpdateProductData extends Partial<CreateProductData> {
  image?: string | null
  images?: string[] | null
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
  createProduct: (data: CreateProductData) => Promise<Product | null>
  updateProduct: (id: string, data: UpdateProductData) => Promise<boolean>
  deleteProduct: (id: string) => Promise<boolean>
  getProduct: (id: string) => Promise<Product | null>
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

  // Stable refs for realtime callbacks
  const fetchProductsRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const fetchCategoriesRef = useRef<() => Promise<void>>(() => Promise.resolve())

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

  // Keep refs updated
  useEffect(() => {
    fetchCategoriesRef.current = fetchCategories
  }, [fetchCategories])

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

  // Keep ref updated
  useEffect(() => {
    fetchProductsRef.current = fetchProducts
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Realtime subscription for products - only depends on tenantId
  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`products-realtime-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] Products change:', payload.eventType)
          // Always refresh to ensure consistency with pagination/filters
          fetchProductsRef.current?.()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Products subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  // Realtime subscription for categories - only depends on tenantId
  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`categories-realtime-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] Categories change:', payload.eventType)
          fetchCategoriesRef.current?.()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Categories subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

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

    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, is_available: isAvailable } : p
    ))
  }, [])

  const createProduct = useCallback(async (data: CreateProductData): Promise<Product | null> => {
    if (!tenantId) return null

    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newProduct, error } = await (supabase as any)
      .from('products')
      .insert({
        tenant_id: tenantId,
        name: data.name,
        price: data.price,
        type: data.type || 'simple',
        category_id: data.category_id || null,
        barcode: data.barcode || null,
        sku: data.sku || null,
        cost_price: data.cost_price || 0,
        is_available: data.is_available ?? true,
        track_stock: data.track_stock || false,
        brand: data.brand || null,
        short_description: data.short_description || null,
        printer_dest: data.printer_dest || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return null
    }

    await fetchProducts()
    return newProduct as Product
  }, [tenantId, fetchProducts])

  const updateProduct = useCallback(async (id: string, data: UpdateProductData): Promise<boolean> => {
    const supabase = createClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.price !== undefined) updateData.price = data.price
    if (data.type !== undefined) updateData.type = data.type
    if (data.category_id !== undefined) updateData.category_id = data.category_id
    if (data.barcode !== undefined) updateData.barcode = data.barcode
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.cost_price !== undefined) updateData.cost_price = data.cost_price
    if (data.is_available !== undefined) updateData.is_available = data.is_available
    if (data.track_stock !== undefined) updateData.track_stock = data.track_stock
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.short_description !== undefined) updateData.short_description = data.short_description
    if (data.printer_dest !== undefined) updateData.printer_dest = data.printer_dest
    if (data.image !== undefined) updateData.image = data.image
    if (data.images !== undefined) updateData.images = data.images

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('products')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating product:', error)
      return false
    }

    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updateData } as Product : p
    ))
    
    return true
  }, [])

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return false
    }

    setProducts(prev => prev.filter(p => p.id !== id))
    setTotalCount(prev => prev - 1)
    return true
  }, [])

  const getProduct = useCallback(async (id: string): Promise<Product | null> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    return data as Product
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
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
  }
}
