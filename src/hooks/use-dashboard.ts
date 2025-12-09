'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailySales, HourlySales, ProductPerformance, Order } from '@/types/database'

interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  avgOrderValue: number
  completedOrders: number
  pendingOrders: number
  cancelledOrders: number
  yesterdayRevenue: number
  lastWeekRevenue: number
}

interface UseDashboardReturn {
  stats: DashboardStats | null
  hourlySales: HourlySales[]
  topProducts: ProductPerformance[]
  recentOrders: Order[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboard(tenantId: string | null): UseDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([])
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    try {
      // Fetch today's sales
      const { data: todaySales } = await supabase
        .from('v_daily_sales')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('date', today)
        .single()

      // Fetch yesterday's sales
      const { data: yesterdaySales } = await supabase
        .from('v_daily_sales')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('date', yesterday)
        .single()

      // Fetch last week's total
      const { data: weekSales } = await supabase
        .from('v_daily_sales')
        .select('completed_revenue')
        .eq('tenant_id', tenantId)
        .gte('date', lastWeek)
        .lte('date', today)

      const lastWeekTotal = (weekSales as DailySales[] || []).reduce(
        (sum, day) => sum + (Number(day.completed_revenue) || 0), 0
      )

      // Build stats
      const todayData = todaySales as DailySales | null
      const yesterdayData = yesterdaySales as DailySales | null
      
      setStats({
        todayRevenue: Number(todayData?.completed_revenue) || 0,
        todayOrders: Number(todayData?.order_count) || 0,
        avgOrderValue: Number(todayData?.avg_order_value) || 0,
        completedOrders: Number(todayData?.completed_count) || 0,
        pendingOrders: Number(todayData?.pending_count) || 0,
        cancelledOrders: Number(todayData?.cancelled_count) || 0,
        yesterdayRevenue: Number(yesterdayData?.completed_revenue) || 0,
        lastWeekRevenue: lastWeekTotal,
      })

      // Fetch hourly sales for chart
      const { data: hourly } = await supabase
        .from('v_hourly_sales')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('date', today)
        .order('hour')

      setHourlySales((hourly as HourlySales[]) || [])

      // Fetch top products
      const { data: products } = await supabase
        .from('v_product_performance')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('total_quantity', { ascending: false })
        .limit(5)

      setTopProducts((products as ProductPerformance[]) || [])

      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentOrders((orders as Order[]) || [])

    } catch (err) {
      setError('Erreur lors du chargement des données')
      console.error(err)
    }

    setIsLoading(false)
  }, [tenantId])

  useEffect(() => {
    fetchDashboard()
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboard, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  return {
    stats,
    hourlySales,
    topProducts,
    recentOrders,
    isLoading,
    error,
    refresh: fetchDashboard,
  }
}
