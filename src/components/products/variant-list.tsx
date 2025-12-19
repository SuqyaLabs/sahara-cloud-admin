'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import { Plus, Pencil, Trash2, Loader2, Package, Globe } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { useLanguages } from '@/hooks/use-languages'
import { useVariantTranslations } from '@/hooks/use-variant-translations'
import { cn } from '@/lib/utils'
import type { Variant, VariantTranslation } from '@/types/database'

interface VariantListProps {
  variants: Variant[]
  productId: string
  tenantId: string
  basePrice: number
  onCreateVariant: (data: CreateVariantData) => Promise<Variant | null>
  onUpdateVariant: (id: string, data: UpdateVariantData) => Promise<boolean>
  onDeleteVariant: (id: string) => Promise<boolean>
}

interface CreateVariantData {
  product_id: string
  tenant_id: string
  name: string
  price_mod?: number
  barcode?: string | null
  sku?: string | null
  track_stock?: boolean
}

interface UpdateVariantData {
  name?: string
  price_mod?: number
  barcode?: string | null
  sku?: string | null
  track_stock?: boolean
}

interface VariantFormData {
  name: string
  price_mod: number
  barcode: string
  sku: string
  track_stock: boolean
  translations: Record<string, { name: string }>
}

const defaultFormData: VariantFormData = {
  name: '',
  price_mod: 0,
  barcode: '',
  sku: '',
  track_stock: false,
  translations: {},
}

export function VariantList({
  variants,
  productId,
  tenantId,
  basePrice,
  onCreateVariant,
  onUpdateVariant,
  onDeleteVariant,
}: VariantListProps) {
  const { t } = useLanguage()
  const { activeLanguages, defaultLanguage } = useLanguages()
  const { fetchTranslations, upsertAllTranslations } = useVariantTranslations()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [deletingVariant, setDeletingVariant] = useState<Variant | null>(null)
  const [formData, setFormData] = useState<VariantFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTranslationTab, setActiveTranslationTab] = useState<string>('')
  
  // Initialize translation tab when languages load
  useEffect(() => {
    if (activeLanguages.length > 0 && !activeTranslationTab) {
      setActiveTranslationTab(defaultLanguage?.code || activeLanguages[0]?.code || 'fr')
    }
  }, [activeLanguages, defaultLanguage, activeTranslationTab])
  
  // Initialize translations for new variant
  const initializeTranslations = useCallback(() => {
    const translationsMap: Record<string, { name: string }> = {}
    activeLanguages.forEach(lang => {
      translationsMap[lang.code] = { name: '' }
    })
    return translationsMap
  }, [activeLanguages])

  const handleOpenCreate = () => {
    setEditingVariant(null)
    setFormData({
      ...defaultFormData,
      translations: initializeTranslations(),
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = async (variant: Variant) => {
    setEditingVariant(variant)
    
    // Load translations for this variant
    const variantTranslations = await fetchTranslations(variant.id)
    const translationsMap: Record<string, { name: string }> = {}
    const defaultLangCode = defaultLanguage?.code || 'fr'
    
    activeLanguages.forEach(lang => {
      const trans = variantTranslations.find(t => t.language_code === lang.code)
      // For default language, fallback to variant.name if no translation exists
      const fallbackName = lang.code === defaultLangCode ? variant.name : ''
      translationsMap[lang.code] = { name: trans?.name || fallbackName }
    })
    
    setFormData({
      name: variant.name,
      price_mod: Number(variant.price_mod) || 0,
      barcode: variant.barcode || '',
      sku: variant.sku || '',
      track_stock: variant.track_stock || false,
      translations: translationsMap,
    })
    setIsFormOpen(true)
  }

  const handleOpenDelete = (variant: Variant) => {
    setDeletingVariant(variant)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get the default language name or the first non-empty translation
    const defaultLangCode = defaultLanguage?.code || 'fr'
    const defaultName = formData.translations[defaultLangCode]?.name?.trim() || formData.name.trim()
    
    if (!defaultName) return

    setIsSubmitting(true)

    let variantId: string | null = null

    if (editingVariant) {
      variantId = editingVariant.id
      await onUpdateVariant(editingVariant.id, {
        name: defaultName,
        price_mod: formData.price_mod,
        barcode: formData.barcode || null,
        sku: formData.sku || null,
        track_stock: formData.track_stock,
      })
    } else {
      const newVariant = await onCreateVariant({
        product_id: productId,
        tenant_id: tenantId,
        name: defaultName,
        price_mod: formData.price_mod,
        barcode: formData.barcode || null,
        sku: formData.sku || null,
        track_stock: formData.track_stock,
      })
      variantId = newVariant?.id || null
    }

    // Save translations if we have a variant ID
    if (variantId && Object.keys(formData.translations).length > 0) {
      await upsertAllTranslations(variantId, formData.translations)
    }

    setIsSubmitting(false)
    setIsFormOpen(false)
    setFormData(defaultFormData)
    setEditingVariant(null)
  }

  const handleDelete = async () => {
    if (!deletingVariant) return

    setIsSubmitting(true)
    await onDeleteVariant(deletingVariant.id)
    setIsSubmitting(false)
    setIsDeleteOpen(false)
    setDeletingVariant(null)
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t('add_variant')}
        </Button>
      </div>

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">{t('no_variants')}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('create_first_variant')}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {variants.map((variant) => {
            const finalPrice = basePrice + Number(variant.price_mod)
            const priceDiff = Number(variant.price_mod)

            return (
              <div
                key={variant.id}
                className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{variant.name}</span>
                    {variant.track_stock && (
                      <Badge variant="outline" className="text-xs">{t('stock_tracked')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    {variant.sku && <span>SKU: {variant.sku}</span>}
                    {variant.barcode && <span>Code: {variant.barcode}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(finalPrice)}</div>
                    {priceDiff !== 0 && (
                      <div className={`text-xs ${priceDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                      </div>
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(variant)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDelete(variant)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? t('edit_variant') : t('new_variant')}
            </DialogTitle>
            <DialogDescription>
              {editingVariant 
                ? t('edit_variant')
                : t('add_variant')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Translation Tabs for Variant Name */}
            {activeLanguages.length > 1 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-1 p-2 bg-muted/30 border-b">
                  <Globe className="w-4 h-4 text-muted-foreground ml-1 mr-1" />
                  {activeLanguages.map((lang) => {
                    const hasTranslation = formData.translations[lang.code]?.name?.trim()
                    const isDefault = lang.code === defaultLanguage?.code
                    
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setActiveTranslationTab(lang.code)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                          activeTranslationTab === lang.code
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        )}
                      >
                        <span className={lang.is_rtl ? 'font-arabic' : ''}>{lang.native_name}</span>
                        {isDefault && (
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                            {t('default')}
                          </Badge>
                        )}
                        {!hasTranslation && !isDefault && (
                          <span className="ml-1 text-amber-500">○</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                
                <div className="p-3" dir={activeLanguages.find(l => l.code === activeTranslationTab)?.is_rtl ? 'rtl' : 'ltr'}>
                  <Label htmlFor={`variant-name-${activeTranslationTab}`} className="text-sm">
                    {t('variant_name')} ({activeLanguages.find(l => l.code === activeTranslationTab)?.native_name}) *
                  </Label>
                  <Input
                    id={`variant-name-${activeTranslationTab}`}
                    value={formData.translations[activeTranslationTab]?.name || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        [activeTranslationTab]: { name: e.target.value },
                      },
                    })}
                    placeholder={t('variant_name_placeholder')}
                    className={cn('mt-1.5', activeLanguages.find(l => l.code === activeTranslationTab)?.is_rtl && 'text-right')}
                    required={activeTranslationTab === defaultLanguage?.code}
                  />
                </div>
              </div>
            )}
            
            {/* Single language fallback */}
            {activeLanguages.length <= 1 && (
              <div className="space-y-2">
                <Label htmlFor="variant-name">{t('variant_name')} *</Label>
                <Input
                  id="variant-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('variant_name_placeholder')}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="price-mod">{t('price_modifier')} (DA)</Label>
              <Input
                id="price-mod"
                type="number"
                step="0.01"
                value={formData.price_mod}
                onChange={(e) => setFormData({ ...formData, price_mod: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                {t('final_price')}: {formatCurrency(basePrice + formData.price_mod)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="variant-sku">{t('sku')}</Label>
                <Input
                  id="variant-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001-L"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-barcode">{t('barcode')}</Label>
                <Input
                  id="variant-barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="1234567890123"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>{t('track_stock')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('manage_stock_levels')}
                </p>
              </div>
              <Switch
                checked={formData.track_stock}
                onCheckedChange={(checked) => setFormData({ ...formData, track_stock: checked })}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || (activeLanguages.length > 1 
                  ? !formData.translations[defaultLanguage?.code || 'fr']?.name?.trim() 
                  : !formData.name.trim()
                )}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingVariant ? t('save') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete_variant')}</DialogTitle>
            <DialogDescription>
              {t('confirm_delete_variant').replace('{name}', deletingVariant?.name || '')}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
