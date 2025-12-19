'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTenant } from '@/hooks/use-tenant'
import { useProducts } from '@/hooks/use-products'
import { useVariants } from '@/hooks/use-variants'
import { useProductMedia, type ProductMedia } from '@/hooks/use-product-media'
import { useProductTranslations } from '@/hooks/use-product-translations'
import { ProductForm, type ProductFormData } from '@/components/products/product-form'
import type { TranslationData } from '@/components/products/translatable-fields'
import { VariantList } from '@/components/products/variant-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Layers, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/lib/i18n'
import type { Product } from '@/types/database'

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  
  const { currentTenant } = useTenant()
  const { categories, getProduct, updateProduct } = useProducts(currentTenant?.id || null)
  const { variants, fetchVariants, createVariant, updateVariant, deleteVariant } = useVariants()
  const { fetchProductMedia } = useProductMedia()
  const { upsertAllTranslations } = useProductTranslations()
  const { toast } = useToast()
  const { t } = useLanguage()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [images, setImages] = useState<ProductMedia[]>([])

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      const data = await getProduct(productId)
      setProduct(data)
      if (data) {
        await fetchVariants(productId)
        // Load images from product_media table
        const mediaItems = await fetchProductMedia(productId)
        setImages(mediaItems)
      }
      setIsLoading(false)
    }
    
    if (productId) {
      loadProduct()
    }
  }, [productId, getProduct, fetchVariants, fetchProductMedia])

  const handleSubmit = async (data: ProductFormData): Promise<boolean> => {
    return await updateProduct(productId, {
      name: data.name,
      price: data.price,
      type: data.type,
      category_id: data.category_id,
      barcode: data.barcode,
      sku: data.sku,
      cost_price: data.cost_price,
      is_available: data.is_available,
      track_stock: data.track_stock,
      brand: data.brand,
      short_description: data.short_description,
      printer_dest: data.printer_dest,
    })
  }

  const handleTranslationsSave = async (translations: Record<string, TranslationData>): Promise<boolean> => {
    if (Object.keys(translations).length === 0) return true
    return await upsertAllTranslations(productId, translations)
  }

  const handleImagesChange = async (newImages: ProductMedia[]) => {
    setImages(newImages)
    
    // Sync primary image URL to products.image field for backward compatibility
    const primaryImage = newImages.find(img => img.is_primary)
    const imageUrls = newImages.map(img => img.url)
    
    // Update products table with primary image and all image URLs
    await updateProduct(productId, {
      image: primaryImage?.url || null,
      images: imageUrls.length > 0 ? imageUrls : null,
    })
    
    toast({
      title: t('images_updated'),
      description: `${newImages.length} image${newImages.length > 1 ? 's' : ''}`,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Skeleton Breadcrumb */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
        {/* Skeleton Header */}
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </div>
        {/* Skeleton Tabs */}
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        {/* Skeleton Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="space-y-6">
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('product_not_found')}</p>
        </CardContent>
      </Card>
    )
  }

  const isVariableProduct = product.type === 'variable'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <Link 
          href="/products" 
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('products')}
        </Link>
        <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t('details')}
          </TabsTrigger>
          {isVariableProduct && (
            <TabsTrigger value="variants" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              {t('variants')} ({variants.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <ProductForm
            product={product}
            categories={categories}
            onSubmit={handleSubmit}
            tenantId={currentTenant?.id}
            images={images}
            onImagesChange={handleImagesChange}
            onTranslationsSave={handleTranslationsSave}
          />
        </TabsContent>

        {isVariableProduct && (
          <TabsContent value="variants" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  {t('product_variants')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VariantList
                  variants={variants}
                  productId={productId}
                  tenantId={currentTenant?.id || ''}
                  basePrice={Number(product.price)}
                  onCreateVariant={createVariant}
                  onUpdateVariant={updateVariant}
                  onDeleteVariant={deleteVariant}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
