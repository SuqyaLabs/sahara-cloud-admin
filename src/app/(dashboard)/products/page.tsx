'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTenant } from '@/hooks/use-tenant'
import { useProducts } from '@/hooks/use-products'
import { useTranslations } from '@/hooks/use-translations'
import { useLanguage } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import type { ProductTranslation, CategoryTranslation } from '@/lib/i18n/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  X,
  Package,
  Plus,
  MoreHorizontal,
  Layers,
  Eye,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

export default function ProductsPage() {
  const { currentTenant } = useTenant()
  const { currentLanguage, t } = useLanguage()
  const { getProductsWithTranslations, getCategoriesWithTranslations } = useTranslations()
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
  const [productTranslations, setProductTranslations] = useState<Map<string, ProductTranslation>>(new Map())
  const [categoryTranslations, setCategoryTranslations] = useState<Map<string, CategoryTranslation>>(new Map())

  // Fetch translations when products or language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      if (products.length > 0) {
        const productIds = products.map(p => p.id)
        const translations = await getProductsWithTranslations(productIds, currentLanguage)
        setProductTranslations(translations)
      }
      if (categories.length > 0) {
        const categoryIds = categories.map(c => c.id)
        const catTranslations = await getCategoriesWithTranslations(categoryIds, currentLanguage)
        setCategoryTranslations(catTranslations)
      }
    }
    fetchTranslations()
  }, [products, categories, currentLanguage, getProductsWithTranslations, getCategoriesWithTranslations])

  // Helper to get translated product name
  const getProductName = (productId: string, fallback: string) => {
    const translation = productTranslations.get(productId)
    return translation?.name || fallback
  }

  // Helper to get translated category name
  const getCategoryName = (categoryId: string, fallback: string) => {
    const translation = categoryTranslations.get(categoryId)
    return translation?.name || fallback
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const categoryOptions = [
    { value: 'all', label: t('all_categories') },
    ...categories.map(c => ({ value: c.id, label: getCategoryName(c.id, c.name) })),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('products')}</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} {t('products').toLowerCase()}
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="w-4 h-4 me-2" />
            {t('add_product')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4">
            <div className="col-span-2 sm:flex-1 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('search') + '...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="ps-9"
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
              <Filter className="w-4 h-4 sm:me-2" />
              <span className="hidden sm:inline">{t('filter')}</span>
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="w-4 h-4 sm:me-2" />
                <span className="hidden sm:inline">{t('clear')}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-start text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  {t('name')}
                </th>
                <th className="text-start text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  {t('category')}
                </th>
                <th className="text-start text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  {t('type')}
                </th>
                <th className="text-end text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  {t('price')}
                </th>
                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  {t('status')}
                </th>
                <th className="text-end text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-[100px]">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted ms-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-muted mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-8 w-8 animate-pulse rounded bg-muted ms-auto" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('no_products')}</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const category = categories.find(c => c.id === product.category_id)
                  const hasImage = product.image && product.image.length > 0
                  
                  return (
                    <tr 
                      key={product.id} 
                      className={cn(
                        'group transition-colors hover:bg-muted/30',
                        updating === product.id && 'opacity-50'
                      )}
                    >
                      {/* Product with Image */}
                      <td className="px-4 py-3">
                        <Link href={`/products/${product.id}`} className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0">
                            {hasImage ? (
                              <Image
                                src={product.image!}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">{getProductName(product.id, product.name)}</span>
                              {product.type === 'variable' && (
                                <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            {product.sku && (
                              <p className="text-xs text-muted-foreground truncate">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {category ? (
                          <span className="text-sm text-muted-foreground">{getCategoryName(category.id, category.name)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs font-normal">
                          {product.type === 'variable' ? t('variable') : product.type === 'composite' ? t('composite') : t('simple')}
                        </Badge>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-end">
                        <span className="font-medium">{formatCurrency(Number(product.price))}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleAvailability(product.id, product.is_available)}
                          disabled={updating === product.id}
                          className="inline-flex"
                        >
                          <Badge 
                            variant={product.is_available ? 'success' : 'destructive'}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {product.is_available ? t('available') : t('unavailable')}
                          </Badge>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/products/${product.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/products/${product.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleToggleAvailability(product.id, product.is_available)}
                          >
                            {product.is_available ? (
                              <ToggleRight className="w-4 h-4 text-success" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('page_of').replace('{page}', String(page)).replace('{total}', String(totalPages))}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
