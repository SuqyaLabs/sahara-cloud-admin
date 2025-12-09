'use client'

import { formatCurrency } from '@/lib/format'
import type { ProductPerformance } from '@/types/database'

interface TopProductsProps {
  products: ProductPerformance[]
  isLoading?: boolean
}

export function TopProducts({ products, isLoading }: TopProductsProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Produits populaires
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune vente pour le moment
        </p>
      </div>
    )
  }

  const maxQuantity = Math.max(...products.map(p => Number(p.total_quantity) || 0))

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Produits populaires (30j)
      </h3>
      <div className="space-y-4">
        {products.map((product, index) => {
          const quantity = Number(product.total_quantity) || 0
          const percentage = maxQuantity > 0 ? (quantity / maxQuantity) * 100 : 0
          
          return (
            <div key={product.product_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-5">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    {product.category_name && (
                      <p className="text-xs text-muted-foreground">
                        {product.category_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {quantity} vendus
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(product.total_revenue) || 0)}
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
