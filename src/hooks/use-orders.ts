'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderLine } from '@/types/database'

interface OrderWithLines extends Order {
  order_lines?: OrderLine[]
}

interface UseOrdersFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

interface UseOrdersReturn {
  orders: OrderWithLines[]
  totalCount: number
  isLoading: boolean
  error: string | null
  page: number
  pageSize: number
  setPage: (page: number) => void
  setFilters: (filters: UseOrdersFilters) => void
  filters: UseOrdersFilters
  refresh: () => Promise<void>
  getOrderDetails: (orderId: string) => Promise<OrderWithLines | null>
}

export function useOrders(tenantId: string | null): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderWithLines[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<UseOrdersFilters>({})
  const pageSize = 25

  const fetchOrders = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59')
      }
      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,waiter_name.ilike.%${filters.search}%`)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, count, error: queryError } = await query

      if (queryError) {
        setError('Erreur lors du chargement des commandes')
        console.error(queryError)
      } else {
        setOrders((data as OrderWithLines[]) || [])
        setTotalCount(count || 0)
      }
    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsLoading(false)
  }, [tenantId, page, filters])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const getOrderDetails = useCallback(async (orderId: string): Promise<OrderWithLines | null> => {
    const supabase = createClient()

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order) return null

    const { data: lines } = await supabase
      .from('order_lines')
      .select('*')
      .eq('order_id', orderId)

    return {
      ...(order as Order),
      order_lines: (lines as OrderLine[]) || [],
    }
  }, [])

  return {
    orders,
    totalCount,
    isLoading,
    error,
    page,
    pageSize,
    setPage,
    setFilters,
    filters,
    refresh: fetchOrders,
    getOrderDetails,
  }
}
