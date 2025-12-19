/**
 * Seed script to add sample products and variants
 * Run with: npx tsx scripts/seed-products.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_ANON_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get tenant ID from command line or use default
const TENANT_ID = process.argv[2] || '58d24907-f52c-4c95-9633-63c140446d65'

async function seedProducts() {
  console.log('🌱 Starting seed for tenant:', TENANT_ID)

  // First, create a category
  const { data: category, error: catError } = await supabase
    .from('categories')
    .upsert({
      tenant_id: TENANT_ID,
      name: 'Plats Principaux',
      type: 'hospitality',
    }, { onConflict: 'tenant_id,name' })
    .select()
    .single()

  if (catError && catError.code !== '23505') {
    console.error('Error creating category:', catError)
  }

  const categoryId = category?.id || null
  console.log('📁 Category:', categoryId ? 'Created/Found' : 'Skipped')

  // Helper to generate unique pb_id
  const genPbId = () => `seed_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  // Sample products
  const products = [
    {
      tenant_id: TENANT_ID,
      name: 'Pizza Margherita',
      type: 'variable' as const,
      price: 1200,
      cost_price: 400,
      is_available: true,
      category_id: categoryId,
      short_description: 'Pizza classique avec tomate, mozzarella et basilic',
      printer_dest: 'oven' as const,
    },
    {
      tenant_id: TENANT_ID,
      name: 'Burger Classic',
      type: 'variable' as const,
      price: 800,
      cost_price: 300,
      is_available: true,
      category_id: categoryId,
      short_description: 'Burger boeuf avec fromage, salade et tomate',
      printer_dest: 'kitchen' as const,
    },
    {
      tenant_id: TENANT_ID,
      name: 'Coca-Cola',
      type: 'simple' as const,
      price: 150,
      cost_price: 80,
      is_available: true,
      category_id: categoryId,
      printer_dest: 'bar' as const,
    },
    {
      tenant_id: TENANT_ID,
      name: 'Salade César',
      type: 'simple' as const,
      price: 650,
      cost_price: 200,
      is_available: true,
      category_id: categoryId,
      printer_dest: 'kitchen' as const,
    },
    {
      tenant_id: TENANT_ID,
      name: 'T-Shirt',
      type: 'variable' as const,
      price: 2500,
      cost_price: 1000,
      is_available: true,
      short_description: 'T-shirt en coton de haute qualité',
    },
  ]

  console.log('📦 Creating products...')

  for (const product of products) {
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        console.log(`  ⏭️  ${product.name} (already exists)`)
      } else {
        console.error(`  ❌ ${product.name}:`, error.message)
      }
      continue
    }

    console.log(`  ✅ ${product.name} (${product.type})`)

    // Add variants for variable products
    if (product.type === 'variable' && newProduct) {
      await addVariantsForProduct(newProduct.id, product.name)
    }
  }

  console.log('\n✨ Seed completed!')
}

interface VariantData {
  name: string
  name_ar: string
  name_en: string
  price_mod: number
}

async function addVariantsForProduct(productId: string, productName: string) {
  let variants: VariantData[] = []

  if (productName.includes('Pizza')) {
    variants = [
      { name: 'Petite (25cm)', name_ar: 'صغيرة (25 سم)', name_en: 'Small (25cm)', price_mod: 0 },
      { name: 'Moyenne (30cm)', name_ar: 'وسط (30 سم)', name_en: 'Medium (30cm)', price_mod: 200 },
      { name: 'Grande (35cm)', name_ar: 'كبيرة (35 سم)', name_en: 'Large (35cm)', price_mod: 400 },
      { name: 'Familiale (40cm)', name_ar: 'عائلية (40 سم)', name_en: 'Family (40cm)', price_mod: 600 },
    ]
  } else if (productName.includes('Burger')) {
    variants = [
      { name: 'Simple', name_ar: 'عادي', name_en: 'Single', price_mod: 0 },
      { name: 'Double', name_ar: 'مزدوج', name_en: 'Double', price_mod: 200 },
      { name: 'Triple', name_ar: 'ثلاثي', name_en: 'Triple', price_mod: 400 },
    ]
  } else if (productName.includes('T-Shirt')) {
    variants = [
      { name: 'S', name_ar: 'S', name_en: 'S', price_mod: 0 },
      { name: 'M', name_ar: 'M', name_en: 'M', price_mod: 0 },
      { name: 'L', name_ar: 'L', name_en: 'L', price_mod: 100 },
      { name: 'XL', name_ar: 'XL', name_en: 'XL', price_mod: 200 },
      { name: 'XXL', name_ar: 'XXL', name_en: 'XXL', price_mod: 300 },
    ]
  }

  for (const variant of variants) {
    const { data: newVariant, error } = await supabase.from('variants').insert({
      tenant_id: TENANT_ID,
      product_id: productId,
      name: variant.name,
      price_mod: variant.price_mod,
      track_stock: false,
    }).select().single()

    if (error) {
      console.log(`      ⚠️  Variant ${variant.name}: ${error.message}`)
    } else {
      console.log(`      📎 ${variant.name} (+${variant.price_mod} DA)`)
      
      // Add translations for Arabic and English
      if (newVariant) {
        await addVariantTranslations(newVariant.id, variant)
      }
    }
  }
}

async function addVariantTranslations(variantId: string, variant: VariantData) {
  const translations = [
    { variant_id: variantId, language_code: 'ar', name: variant.name_ar },
    { variant_id: variantId, language_code: 'en', name: variant.name_en },
  ]

  for (const translation of translations) {
    const { error } = await supabase
      .from('variant_translations')
      .upsert(translation, { onConflict: 'variant_id,language_code' })

    if (error) {
      console.log(`        ⚠️  Translation ${translation.language_code}: ${error.message}`)
    } else {
      console.log(`        🌐 ${translation.language_code}: ${translation.name}`)
    }
  }
}

// Run the seed
seedProducts().catch(console.error)
