export type LanguageCode = 'fr' | 'ar' | 'en'

export interface Language {
  code: LanguageCode
  name: string
  native_name: string
  is_default: boolean
  is_rtl: boolean
  is_active: boolean
}

export interface ProductTranslation {
  id: string
  product_id: string
  language_code: LanguageCode
  name: string
  short_description: string | null
  long_description: string | null
  seo_title: string | null
  seo_description: string | null
}

export interface CategoryTranslation {
  id: string
  category_id: string
  language_code: LanguageCode
  name: string
  description: string | null
}

export interface VariantTranslation {
  id: string
  variant_id: string
  language_code: LanguageCode
  name: string
}

export interface TranslatedProduct {
  id: string
  name: string
  short_description: string | null
  long_description: string | null
  seo_title: string | null
  seo_description: string | null
  // Original fields
  price: number
  type: string
  is_available: boolean
  image: string | null
  images: string[] | null
  category_id: string | null
  barcode: string | null
  sku: string | null
  brand: string | null
}

export interface TranslatedCategory {
  id: string
  name: string
  description: string | null
  // Original fields
  type: string
  parent_id: string | null
}

export interface TranslatedVariant {
  id: string
  name: string
  // Original fields
  product_id: string
  price_mod: number
  barcode: string | null
  sku: string | null
}
