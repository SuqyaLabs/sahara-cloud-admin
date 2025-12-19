'use client'

import { useTenant } from '@/hooks/use-tenant'
import { useDashboard } from '@/hooks/use-dashboard'
import { useLanguage } from '@/lib/i18n'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TopProducts } from '@/components/dashboard/top-products'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { formatCurrency } from '@/lib/format'
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { currentTenant, isLoading: tenantLoading } = useTenant()
  const { t } = useLanguage()
  const { 
    stats, 
    hourlySales, 
    topProducts, 
    recentOrders, 
    isLoading,
    refresh 
  } = useDashboard(currentTenant?.id || null)

  const loading = tenantLoading || isLoading

  // Calculate change percentages
  const revenueChange = stats && stats.yesterdayRevenue > 0
    ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('dashboard')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('performance_today')} {currentTenant?.name || t('your_restaurant')}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refresh}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('today_revenue')}
          value={formatCurrency(stats?.todayRevenue || 0)}
          change={revenueChange}
          changeLabel={t('vs_yesterday')}
          icon={DollarSign}
          isLoading={loading}
        />
        <StatsCard
          title={t('today_orders')}
          value={String(stats?.todayOrders || 0)}
          icon={ShoppingCart}
          isLoading={loading}
        />
        <StatsCard
          title={t('avg_order')}
          value={formatCurrency(stats?.avgOrderValue || 0)}
          icon={TrendingUp}
          isLoading={loading}
        />
        <StatsCard
          title={t('completion_rate')}
          value={stats && stats.todayOrders > 0 
            ? `${Math.round((stats.completedOrders / stats.todayOrders) * 100)}%`
            : '0%'
          }
          icon={CheckCircle}
          isLoading={loading}
        />
      </div>

      {/* Order Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.completedOrders || 0}</p>
            <p className="text-sm text-muted-foreground">{t('completed')}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
            <p className="text-sm text-muted-foreground">{t('pending')}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.cancelledOrders || 0}</p>
            <p className="text-sm text-muted-foreground">{t('cancelled')}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={hourlySales} isLoading={loading} />
        </div>
        <div>
          <TopProducts products={topProducts} isLoading={loading} />
        </div>
      </div>

      {/* Recent Orders */}
      <RecentOrders orders={recentOrders} isLoading={loading} />
    </div>
  )
}
