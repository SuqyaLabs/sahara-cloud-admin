'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  isLoading?: boolean
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon,
  isLoading 
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-2 min-w-0">
            <div className="h-3 sm:h-4 w-16 sm:w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 sm:h-8 w-20 sm:w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 sm:w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse rounded-lg bg-muted shrink-0" />
        </div>
      </div>
    )
  }

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="w-3 h-3" />
    }
    return change > 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    )
  }

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground'
    return change > 0 ? 'text-emerald-500' : 'text-red-500'
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6 hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold truncate">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-muted-foreground ml-1 hidden sm:inline">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
      </div>
    </div>
  )
}
