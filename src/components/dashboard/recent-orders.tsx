'use client'

import Link from 'next/link'
import { formatCurrency, formatRelativeDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import type { Order } from '@/types/database'

interface RecentOrdersProps {
  orders: Order[]
  isLoading?: boolean
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  confirmed: { label: 'Confirmé', variant: 'warning' },
  preparing: { label: 'Prép.', variant: 'info' as 'warning' },
  ready: { label: 'Prêt', variant: 'secondary' },
  completed: { label: 'Terminé', variant: 'success' },
  void: { label: 'Annulé', variant: 'destructive' },
}

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Commandes récentes
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune commande pour le moment
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Commandes récentes
        </h3>
        <Link 
          href="/orders" 
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          Voir tout
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="divide-y divide-border">
        {orders.map((order) => {
          const status = statusConfig[order.status] || statusConfig.confirmed
          const total = Number(order.total_gross) - Number(order.discount_amount || 0)
          
          return (
            <div 
              key={order.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between py-3 first:pt-0 last:pb-0 gap-2"
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-sm font-mono font-medium">
                  #{order.order_number}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {formatRelativeDate(order.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <span className="text-sm font-medium">
                  {formatCurrency(total)}
                </span>
                <Badge variant={status.variant}>
                  {status.label}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
