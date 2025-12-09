'use client'

import { useState } from 'react'
import { useTenant } from '@/hooks/use-tenant'
import { useProducts } from '@/hooks/use-products'
import { formatCurrency } from '@/lib/format'
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
  Package,
  Check,
  XCircle
} from 'lucide-react'

export default function ProductsPage() {
  const { currentTenant } = useTenant()
  const {
    products,
    categories,
    totalCount,
    isLoading,
    page,
    pageSize,
    setPage,
    setFilters,
    filters,
    toggleAvailability,
  } = useProducts(currentTenant?.id || null)

  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  const categoryOptions = [
    { value: 'all', label: 'Toutes les catégories' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ]

  const handleSearch = () => {
    setFilters({ ...filters, search: search || undefined })
    setPage(1)
  }

  const handleCategoryChange = (categoryId: string) => {
    setFilters({ ...filters, categoryId: categoryId === 'all' ? undefined : categoryId })
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearch('')
    setPage(1)
  }

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    setUpdating(productId)
    await toggleAvailability(productId, !currentStatus)
    setUpdating(null)
  }

  const hasFilters = filters.categoryId || filters.search

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Produits</h1>
        <p className="text-muted-foreground text-sm">
          {totalCount} produit{totalCount > 1 ? 's' : ''} dans le catalogue
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4">
            <div className="col-span-2 sm:flex-1 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="col-span-2 sm:w-[200px]">
              <Select
                options={categoryOptions}
                value={filters.categoryId || 'all'}
                onChange={(e) => handleCategoryChange(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Filter className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Filtrer</span>
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Effacer</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun produit trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const category = categories.find(c => c.id === product.category_id)
            
            return (
              <Card key={product.id} className="hover:border-border/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      {category && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {category.name}
                        </p>
                      )}
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(Number(product.price))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Badge variant={product.is_available ? 'success' : 'destructive'}>
                      {product.is_available ? 'Disponible' : 'Indisponible'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAvailability(product.id, product.is_available)}
                      disabled={updating === product.id}
                    >
                      {product.is_available ? (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Activer
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
    </div>
  )
}
