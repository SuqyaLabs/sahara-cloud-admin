'use client'

import { useMemo } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { HourlySales } from '@/types/database'

interface RevenueChartProps {
  data: HourlySales[]
  isLoading?: boolean
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Generate all 24 hours with 0 revenue as default
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      revenue: 0,
      orders: 0,
    }))

    // Fill in actual data
    data.forEach((item) => {
      const hourIndex = item.hour
      if (hourIndex >= 0 && hourIndex < 24) {
        hours[hourIndex].revenue = Number(item.revenue) || 0
        hours[hourIndex].orders = Number(item.order_count) || 0
      }
    })

    return hours
  }, [data])

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-muted mb-4" />
        <div className="h-[250px] sm:h-[300px] animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Revenus par heure (aujourd&apos;hui)
      </h3>
      <div className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="label" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [formatCurrency(value), 'Revenus']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
