'use client'

import { useState } from 'react'
import { useTenant } from '@/hooks/use-tenant'
import { useOrders } from '@/hooks/use-orders'
import { useLanguage } from '@/lib/i18n'
import { formatCurrency, formatRelativeDate, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  X,
  Eye,
  Download
} from 'lucide-react'

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'ready', label: 'Prêt' },
  { value: 'completed', label: 'Terminé' },
  { value: 'void', label: 'Annulé' },
]

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  confirmed: { label: 'Confirmé', variant: 'warning' },
  preparing: { label: 'En préparation', variant: 'info' },
  ready: { label: 'Prêt', variant: 'warning' },
  completed: { label: 'Terminé', variant: 'success' },
  void: { label: 'Annulé', variant: 'destructive' },
}

const typeConfig: Record<string, string> = {
  dine_in: 'Sur place',
  takeaway: 'À emporter',
  delivery: 'Livraison',
}

export default function OrdersPage() {
  const { currentTenant } = useTenant()
  const { t } = useLanguage()
  const {
    orders,
    totalCount,
    isLoading,
    page,
    pageSize,
    setPage,
    setFilters,
    filters,
  } = useOrders(currentTenant?.id || null)

  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleSearch = () => {
    setFilters({ ...filters, search })
    setPage(1)
  }

  const handleStatusChange = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : status })
    setPage(1)
  }

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    setFilters({
      ...filters,
      [type === 'from' ? 'dateFrom' : 'dateTo']: value || undefined,
    })
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearch('')
    setPage(1)
  }

  const hasFilters = filters.status || filters.dateFrom || filters.dateTo || filters.search

  const exportToCSV = () => {
    const headers = ['Numéro', 'Date', 'Type', 'Statut', 'Total', 'Serveur']
    const rows = orders.map(order => [
      order.order_number,
      formatDate(order.created_at, 'dd/MM/yyyy HH:mm'),
      typeConfig[order.type] || order.type,
      statusConfig[order.status]?.label || order.status,
      Number(order.total_gross) - Number(order.discount_amount || 0),
      order.waiter_name || '-',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commandes-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('orders')}</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} {t('orders').toLowerCase()} {t('found')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV} className="self-start sm:self-auto">
          <Download className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{t('export_csv')}</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4">
            <div className="col-span-2 sm:flex-1 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('search') + '...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="col-span-2 sm:w-[180px]">
              <Select
                options={statusOptions}
                value={filters.status || 'all'}
                onChange={(e) => handleStatusChange(e.target.value)}
              />
            </div>
            <div className="sm:w-[140px]">
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateChange('from', e.target.value)}
                placeholder="Début"
              />
            </div>
            <div className="sm:w-[140px]">
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateChange('to', e.target.value)}
                placeholder="Fin"
              />
            </div>
            <Button variant="outline" onClick={handleSearch} className="col-span-1">
              <Filter className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('filter')}</span>
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="col-span-1">
                <X className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('clear')}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Numéro</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Total</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Serveur</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-4"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    <td className="p-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
                    <td className="p-4"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    <td className="p-4"><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></td>
                    <td className="p-4"><div className="h-4 w-16 animate-pulse rounded bg-muted ml-auto" /></td>
                    <td className="p-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
                    <td className="p-4"><div className="h-8 w-8 animate-pulse rounded bg-muted ml-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {t('no_orders')}
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const total = Number(order.total_gross) - Number(order.discount_amount || 0)
                  
                  return (
                    <tr 
                      key={order.id} 
                      className="group border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium">#{order.order_number}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {formatRelativeDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">
                        {typeConfig[order.type] || order.type}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {order.waiter_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSelectedOrder(order.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
