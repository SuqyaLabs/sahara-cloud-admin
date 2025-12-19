# Multi-Language Support Changelog

## Migration: `create_translation_tables`
**Date:** 2024-12-14  
**Database:** Supabase Project `zhfietudqhbjuqjqfvpa`

---

## Summary

This migration adds multi-language support for products, categories, and variants. The system supports **French (fr)**, **Arabic (ar)**, and **English (en)** languages.

---

## New Tables

### 1. `public.languages`
Stores supported languages configuration.

| Column | Type | Description |
|--------|------|-------------|
| `code` | text (PK) | Language code (fr, ar, en) |
| `name` | text | Language name in English |
| `native_name` | text | Language name in native script |
| `is_default` | boolean | Default language flag |
| `is_rtl` | boolean | Right-to-left flag |
| `is_active` | boolean | Active status |
| `created_at` | timestamptz | Creation timestamp |

**Pre-seeded data:**
- `fr` - Français (default)
- `ar` - العربية (RTL)
- `en` - English

---

### 2. `public.product_translations`
Stores translated product content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique identifier |
| `product_id` | uuid (FK) | Reference to `products.id` |
| `language_code` | text (FK) | Reference to `languages.code` |
| `name` | text | Translated product name |
| `short_description` | text | Translated short description |
| `long_description` | text | Translated long description |
| `seo_title` | text | Translated SEO title |
| `seo_description` | text | Translated SEO description |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Unique Constraint:** `(product_id, language_code)`

---

### 3. `public.category_translations`
Stores translated category content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique identifier |
| `category_id` | uuid (FK) | Reference to `categories.id` |
| `language_code` | text (FK) | Reference to `languages.code` |
| `name` | text | Translated category name |
| `description` | text | Translated category description |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Unique Constraint:** `(category_id, language_code)`

---

### 4. `public.variant_translations`
Stores translated variant content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique identifier |
| `variant_id` | uuid (FK) | Reference to `variants.id` |
| `language_code` | text (FK) | Reference to `languages.code` |
| `name` | text | Translated variant name |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Unique Constraint:** `(variant_id, language_code)`

---

## Indexes Created

- `idx_product_translations_product_id` - For fast product lookups
- `idx_product_translations_language` - For language filtering
- `idx_category_translations_category_id` - For fast category lookups
- `idx_category_translations_language` - For language filtering
- `idx_variant_translations_variant_id` - For fast variant lookups
- `idx_variant_translations_language` - For language filtering

---

## RLS Policies

### Languages Table
- **SELECT:** Public (everyone can read)

### Translation Tables (product_translations, category_translations, variant_translations)
- **SELECT:** Public (everyone can read)
- **INSERT/UPDATE/DELETE:** Authenticated users only

---

## Usage Examples

### Fetch product with translation
```sql
SELECT 
  p.id,
  p.price,
  COALESCE(pt.name, p.name) as name,
  COALESCE(pt.short_description, p.short_description) as short_description
FROM products p
LEFT JOIN product_translations pt 
  ON pt.product_id = p.id 
  AND pt.language_code = 'ar'
WHERE p.id = 'your-product-id';
```

### Fetch category with translation
```sql
SELECT 
  c.id,
  c.type,
  COALESCE(ct.name, c.name) as name,
  ct.description
FROM categories c
LEFT JOIN category_translations ct 
  ON ct.category_id = c.id 
  AND ct.language_code = 'en'
WHERE c.id = 'your-category-id';
```

### Upsert translation
```sql
INSERT INTO product_translations (product_id, language_code, name, short_description)
VALUES ('product-uuid', 'ar', 'اسم المنتج', 'وصف قصير')
ON CONFLICT (product_id, language_code) 
DO UPDATE SET 
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  updated_at = now();
```

---

## Integration Guide for Other Projects

### 1. Supabase Client Setup

```typescript
// Fetch translations for a product
const { data } = await supabase
  .from('product_translations')
  .select('*')
  .eq('product_id', productId)
  .eq('language_code', languageCode)
  .single();
```

### 2. Fallback Strategy

Always implement a fallback to the default language (French) if translation is not found:

```typescript
async function getProductWithTranslation(productId: string, lang: string) {
  // Try requested language first
  let { data: translation } = await supabase
    .from('product_translations')
    .select('*')
    .eq('product_id', productId)
    .eq('language_code', lang)
    .single();
  
  // Fallback to French if not found
  if (!translation && lang !== 'fr') {
    const { data: frTranslation } = await supabase
      .from('product_translations')
      .select('*')
      .eq('product_id', productId)
      .eq('language_code', 'fr')
      .single();
    translation = frTranslation;
  }
  
  return translation;
}
```

### 3. Batch Fetch Translations

```typescript
async function getProductsWithTranslations(productIds: string[], lang: string) {
  const { data } = await supabase
    .from('product_translations')
    .select('*')
    .in('product_id', productIds)
    .eq('language_code', lang);
  
  return new Map(data?.map(t => [t.product_id, t]) || []);
}
```

---

## Pre-seeded Translations

All existing products and categories have been seeded with translations in:
- **French (fr)** - Copied from original `name`, `short_description`, `long_description` fields
- **Arabic (ar)** - Professional Arabic translations
- **English (en)** - Professional English translations

---

## Migration SQL Reference

```sql
-- Check all translations for a product
SELECT * FROM product_translations WHERE product_id = 'your-id';

-- Check all translations for a category
SELECT * FROM category_translations WHERE category_id = 'your-id';

-- List all supported languages
SELECT * FROM languages WHERE is_active = true;
```

---

## Notes

1. The original `name`, `short_description`, `long_description` fields in `products` and `categories` tables are kept for backward compatibility
2. New applications should read from translation tables with fallback to original fields
3. RTL support: Arabic (`ar`) has `is_rtl = true` - use this to set `dir="rtl"` on the document
4. All foreign keys have `ON DELETE CASCADE` - deleting a product/category will automatically delete its translations
