'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailySales, PaymentBreakdown } from '@/types/database'

interface UseReportsReturn {
  dailySales: DailySales[]
  paymentBreakdown: PaymentBreakdown[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useReports(
  tenantId: string | null,
  dateFrom: string,
  dateTo: string
): UseReportsReturn {
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable ref for realtime callback
  const fetchReportsRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const fetchReports = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Fetch daily sales
      const { data: sales, error: salesError } = await supabase
        .from('v_daily_sales')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date')

      if (salesError) {
        console.error('Error fetching daily sales:', salesError)
        setError('Erreur lors du chargement des ventes')
      } else {
        setDailySales((sales as DailySales[]) || [])
      }

      // Fetch payment breakdown
      const { data: payments, error: paymentsError } = await supabase
        .from('v_payment_breakdown')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('date', dateFrom)
        .lte('date', dateTo)

      if (paymentsError) {
        console.error('Error fetching payment breakdown:', paymentsError)
      } else {
        setPaymentBreakdown((payments as PaymentBreakdown[]) || [])
      }
    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsLoading(false)
  }, [tenantId, dateFrom, dateTo])

  // Keep ref updated
  useEffect(() => {
    fetchReportsRef.current = fetchReports
  }, [fetchReports])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Realtime subscription for orders (reports are derived from orders)
  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`reports-orders-realtime-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] Reports - Orders change:', payload.eventType)
          // Refresh reports when orders change
          fetchReportsRef.current()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Reports subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  // Realtime subscription for payments
  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`reports-payments-realtime-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] Reports - Payments change:', payload.eventType)
          // Refresh reports when payments change
          fetchReportsRef.current()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Payments subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  return {
    dailySales,
    paymentBreakdown,
    isLoading,
    error,
    refresh: fetchReports,
  }
}
