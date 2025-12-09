'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/hooks/use-tenant'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { Download, Calendar, TrendingUp, CreditCard } from 'lucide-react'
import type { DailySales, PaymentBreakdown } from '@/types/database'

const PAYMENT_COLORS = {
  cash: '#10b981',
  cib_card: '#3b82f6',
  edahabia: '#8b5cf6',
  check: '#f59e0b',
  qr: '#ec4899',
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  cib_card: 'Carte CIB',
  edahabia: 'Edahabia',
  check: 'Chèque',
  qr: 'QR Code',
}

export default function ReportsPage() {
  const { currentTenant } = useTenant()
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentTenant?.id) return

    const fetchReports = async () => {
      setIsLoading(true)
      const supabase = createClient()

      // Fetch daily sales
      const { data: sales } = await supabase
        .from('v_daily_sales')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date')

      setDailySales((sales as DailySales[]) || [])

      // Fetch payment breakdown
      const { data: payments } = await supabase
        .from('v_payment_breakdown')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)

      setPaymentBreakdown((payments as PaymentBreakdown[]) || [])
      setIsLoading(false)
    }

    fetchReports()
  }, [currentTenant?.id, dateFrom, dateTo])

  // Calculate totals
  const totalRevenue = dailySales.reduce((sum, d) => sum + Number(d.completed_revenue || 0), 0)
  const totalOrders = dailySales.reduce((sum, d) => sum + Number(d.completed_count || 0), 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Aggregate payments by method
  const paymentTotals = paymentBreakdown.reduce((acc, p) => {
    const method = p.method
    if (!acc[method]) {
      acc[method] = { method, total: 0, count: 0 }
    }
    acc[method].total += Number(p.total_amount || 0)
    acc[method].count += Number(p.payment_count || 0)
    return acc
  }, {} as Record<string, { method: string; total: number; count: number }>)

  const paymentChartData = Object.values(paymentTotals).map(p => ({
    name: PAYMENT_LABELS[p.method] || p.method,
    value: p.total,
    color: PAYMENT_COLORS[p.method as keyof typeof PAYMENT_COLORS] || '#6b7280',
  }))

  // Chart data for daily sales
  const chartData = dailySales.map(d => ({
    date: formatDate(d.date, 'dd/MM'),
    revenue: Number(d.completed_revenue || 0),
    orders: Number(d.completed_count || 0),
  }))

  const exportToCSV = () => {
    const headers = ['Date', 'Commandes', 'Revenus', 'Panier Moyen']
    const rows = dailySales.map(d => [
      formatDate(d.date, 'dd/MM/yyyy'),
      d.completed_count,
      Number(d.completed_revenue || 0),
      Number(d.avg_order_value || 0).toFixed(2),
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-${dateFrom}-${dateTo}.csv`
    a.click()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Rapports</h1>
          <p className="text-muted-foreground text-sm">
            Analyse des ventes et performances
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV} className="self-start sm:self-auto">
          <Download className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Exporter</span> CSV
        </Button>
      </div>

      {/* Date Range */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Période:</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 sm:w-[140px] sm:flex-none"
              />
              <span className="text-muted-foreground">à</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 sm:w-[140px] sm:flex-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Panier moyen</p>
                <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Daily Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Revenus journaliers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] animate-pulse rounded bg-muted" />
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
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
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Modes de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] animate-pulse rounded bg-muted" />
            ) : paymentChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Détail journalier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Commandes</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Terminées</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Annulées</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Revenus</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Panier Moyen</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                      <td className="p-3"><div className="h-4 w-12 animate-pulse rounded bg-muted ml-auto" /></td>
                      <td className="p-3"><div className="h-4 w-12 animate-pulse rounded bg-muted ml-auto" /></td>
                      <td className="p-3"><div className="h-4 w-12 animate-pulse rounded bg-muted ml-auto" /></td>
                      <td className="p-3"><div className="h-4 w-20 animate-pulse rounded bg-muted ml-auto" /></td>
                      <td className="p-3"><div className="h-4 w-16 animate-pulse rounded bg-muted ml-auto" /></td>
                    </tr>
                  ))
                ) : dailySales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Aucune donnée pour cette période
                    </td>
                  </tr>
                ) : (
                  dailySales.map((day) => (
                    <tr key={day.date} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 font-medium">{formatDate(day.date, 'dd/MM/yyyy')}</td>
                      <td className="p-3 text-right">{day.order_count}</td>
                      <td className="p-3 text-right text-emerald-500">{day.completed_count}</td>
                      <td className="p-3 text-right text-red-500">{day.cancelled_count}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(Number(day.completed_revenue || 0))}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatCurrency(Number(day.avg_order_value || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
