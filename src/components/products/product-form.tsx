'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, X, CircleDot, AlertCircle } from 'lucide-react'
import { ProductImages } from './product-images'
import { TranslatableFields, type TranslationData } from './translatable-fields'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
import type { Product, Category } from '@/types/database'
import type { ProductMedia } from '@/hooks/use-product-media'

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
  onSubmit: (data: ProductFormData) => Promise<boolean>
  isLoading?: boolean
  tenantId?: string
  images?: ProductMedia[]
  onImagesChange?: (images: ProductMedia[]) => void
  onTranslationsSave?: (translations: Record<string, TranslationData>) => Promise<boolean>
}

export interface ProductFormData {
  name: string
  price: number
  type: 'simple' | 'variable' | 'composite'
  category_id: string | null
  barcode: string | null
  sku: string | null
  cost_price: number
  is_available: boolean
  track_stock: boolean
  brand: string | null
  short_description: string | null
  printer_dest: 'kitchen' | 'bar' | 'oven' | null
}

// Options will be translated inside the component using t()

export function ProductForm({ 
  product, 
  categories, 
  onSubmit, 
  isLoading,
  tenantId,
  images = [],
  onImagesChange,
  onTranslationsSave,
}: ProductFormProps) {
  const router = useRouter()
  const { t, currentLanguage } = useLanguage()
  const isEditing = !!product

  // Translated options
  const typeOptions = [
    { value: 'simple', label: t('simple') },
    { value: 'variable', label: t('variable') },
    { value: 'composite', label: t('composite') },
  ]

  const printerOptions = [
    { value: '', label: t('none') },
    { value: 'kitchen', label: t('kitchen') },
    { value: 'bar', label: t('bar') },
    { value: 'oven', label: t('oven') },
  ]

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    price: product?.price ? Number(product.price) : 0,
    type: (product?.type as ProductFormData['type']) || 'simple',
    category_id: product?.category_id || null,
    barcode: product?.barcode || null,
    sku: product?.sku || null,
    cost_price: product?.cost_price ? Number(product.cost_price) : 0,
    is_available: product?.is_available ?? true,
    track_stock: product?.track_stock ?? false,
    brand: product?.brand || null,
    short_description: product?.short_description || null,
    printer_dest: (product?.printer_dest as ProductFormData['printer_dest']) || null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingTranslations, setPendingTranslations] = useState<Record<string, TranslationData>>({})

  // Track form dirty state
  const initialData = useMemo(() => ({
    name: product?.name || '',
    price: product?.price ? Number(product.price) : 0,
    type: (product?.type as ProductFormData['type']) || 'simple',
    category_id: product?.category_id || null,
    barcode: product?.barcode || null,
    sku: product?.sku || null,
    cost_price: product?.cost_price ? Number(product.cost_price) : 0,
    is_available: product?.is_available ?? true,
    track_stock: product?.track_stock ?? false,
    brand: product?.brand || null,
    short_description: product?.short_description || null,
    printer_dest: (product?.printer_dest as ProductFormData['printer_dest']) || null,
  }), [product])

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData)
  }, [formData, initialData])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const categoryOptions = [
    { value: '', label: t('select_category') },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || formData.price < 0) return

    setIsSubmitting(true)
    const success = await onSubmit(formData)
    
    // Save translations if product was saved successfully and we're editing
    if (success && isEditing && onTranslationsSave && Object.keys(pendingTranslations).length > 0) {
      await onTranslationsSave(pendingTranslations)
    }
    
    setIsSubmitting(false)

    if (success) {
      router.push('/products')
    }
  }

  const updateField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {isEditing ? product?.name : t('add_product')}
              </h1>
              {isDirty && (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  {t('unsaved_changes')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (isDirty) {
                  if (confirm(t('unsaved_changes_confirm'))) {
                    router.back()
                  }
                } else {
                  router.back()
                }
              }}
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              size="sm"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mobile-first: Status card appears first on mobile */}
        <div className="lg:hidden space-y-6">
          {/* Status Card - Mobile */}
          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-medium">{t('status')}</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateField('is_available', true)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-md border text-sm transition-colors',
                  formData.is_available 
                    ? 'border-primary bg-primary/5 text-primary font-medium' 
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <CircleDot className="w-4 h-4" />
                {t('active')}
              </button>
              <button
                type="button"
                onClick={() => updateField('is_available', false)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-md border text-sm transition-colors',
                  !formData.is_available 
                    ? 'border-primary bg-primary/5 text-primary font-medium' 
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <X className="w-4 h-4" />
                {t('draft')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description Card with Multi-language Support */}
          <TranslatableFields
            productId={product?.id}
            defaultName={formData.name}
            defaultDescription={formData.short_description}
            onDefaultNameChange={(name) => updateField('name', name)}
            onDefaultDescriptionChange={(desc) => updateField('short_description', desc)}
            onTranslationsChange={setPendingTranslations}
            isEditing={isEditing}
          />

          {/* Media Card */}
          {isEditing && tenantId && product && onImagesChange && (
            <div className="bg-card rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{t('media')}</h3>
                {images.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {images.length} image{images.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <ProductImages
                images={images}
                productId={product.id}
                tenantId={tenantId}
                onImagesChange={onImagesChange}
                maxImages={10}
              />
            </div>
          )}

          {/* Pricing Card */}
          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-medium">{t('pricing')}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm">
                  {t('price')}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    DA
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cost_price" className="text-sm">
                  {t('cost_per_item')}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    DA
                  </span>
                  <Input
                    id="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => updateField('cost_price', parseFloat(e.target.value) || 0)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
            </div>

            {formData.price > 0 && formData.cost_price > 0 && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md text-sm">
                <div>
                  <span className="text-muted-foreground">{t('margin')}: </span>
                  <span className="font-medium">
                    {((formData.price - formData.cost_price) / formData.price * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('profit')}: </span>
                  <span className="font-medium">
                    {(formData.price - formData.cost_price).toFixed(2)} DA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Inventory Card */}
          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-medium">{t('inventory')}</h3>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t('track_quantity')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('manage_stock_levels')}
                </p>
              </div>
              <Switch
                checked={formData.track_stock}
                onCheckedChange={(checked) => updateField('track_stock', checked)}
              />
            </div>

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sku" className="text-sm">
                    {t('sku_label')}
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku || ''}
                    onChange={(e) => updateField('sku', e.target.value || null)}
                    placeholder="SKU-001"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="barcode" className="text-sm">
                    {t('barcode_label')}
                  </Label>
                  <Input
                    id="barcode"
                    value={formData.barcode || ''}
                    onChange={(e) => updateField('barcode', e.target.value || null)}
                    placeholder="1234567890123"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brand" className="text-sm">
                    {t('brand_supplier')}
                  </Label>
                  <Input
                    id="brand"
                    value={formData.brand || ''}
                    onChange={(e) => updateField('brand', e.target.value || null)}
                    placeholder="Nom de la marque"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Options Card */}
          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-medium">{t('print_options')}</h3>
            
            <div className="space-y-1.5">
              <Label htmlFor="printer" className="text-sm">
                {t('print_destination')}
              </Label>
              <Select
                options={printerOptions}
                value={formData.printer_dest || ''}
                onChange={(e) => updateField('printer_dest', (e.target.value || null) as ProductFormData['printer_dest'])}
              />
              <p className="text-xs text-muted-foreground">
                {t('print_destination_help')}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Status Card - Desktop Only (mobile version is above) */}
          <div className="hidden lg:block bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-medium">{t('status')}</h3>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => updateField('is_available', true)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-md border text-left transition-colors',
                  formData.is_available 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <CircleDot className={cn(
                  'w-4 h-4',
                  formData.is_available ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="text-sm font-medium">{t('active')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('visible_catalog')}
                  </p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => updateField('is_available', false)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-md border text-left transition-colors',
                  !formData.is_available 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <X className={cn(
                  'w-4 h-4',
                  !formData.is_available ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="text-sm font-medium">{t('draft')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('not_visible_customers')}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Organization Card */}
          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-medium">{t('organization')}</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-sm">
                  {t('product_type')}
                </Label>
                <Select
                  options={typeOptions}
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value as ProductFormData['type'])}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm">
                  {t('category')}
                </Label>
                <Select
                  options={categoryOptions}
                  value={formData.category_id || ''}
                  onChange={(e) => updateField('category_id', e.target.value || null)}
                />
              </div>
            </div>
          </div>

          {/* Product Info Card (only when editing) */}
          {isEditing && product && (
            <div className="bg-card rounded-lg border border-border p-5 space-y-3">
              <h3 className="text-sm font-medium">{t('information')}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{product.id.slice(0, 8)}...</span>
                </div>
                {product.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('created')}</span>
                    <span>{new Date(product.created_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : currentLanguage === 'en' ? 'en-US' : 'fr-FR')}</span>
                  </div>
                )}
                {product.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('modified')}</span>
                    <span>{new Date(product.updated_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : currentLanguage === 'en' ? 'en-US' : 'fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
