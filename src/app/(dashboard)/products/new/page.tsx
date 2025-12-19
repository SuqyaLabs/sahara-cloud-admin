'use client'

import { useTenant } from '@/hooks/use-tenant'
import { useProducts } from '@/hooks/use-products'
import { ProductForm, type ProductFormData } from '@/components/products/product-form'

export default function NewProductPage() {
  const { currentTenant } = useTenant()
  const { categories, createProduct } = useProducts(currentTenant?.id || null)

  const handleSubmit = async (data: ProductFormData): Promise<boolean> => {
    const product = await createProduct({
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
    return !!product
  }

  return (
    <ProductForm
      categories={categories}
      onSubmit={handleSubmit}
    />
  )
}
