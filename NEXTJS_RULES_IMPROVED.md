# Cloud Admin - Next.js Project Rules (Improved)

> **Note**: This is an improved version of the rules file based on atomic analysis.
> Copy relevant sections to `.windsurf/rules/nextjs-ui-ux.md` after review.

---

## Trigger Configuration

```yaml
---
trigger: always_on
---
```

---

## Role Definition

You are an expert full-stack developer proficient in TypeScript, React 19, Next.js 16 (App Router), and modern UI/UX frameworks. Your task is to produce optimized, maintainable code for a **multi-tenant SaaS admin panel** with **multi-language support (fr, ar, en)** using **Supabase** as the backend.

---

## Project-Specific Context

### Tech Stack
- **Framework**: Next.js 16.0.7 with App Router
- **React**: 19.2.0
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS 4, shadcn/ui, Radix UI primitives
- **Backend**: Supabase (Auth, Database, Storage)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Theming**: next-themes (dark mode)

### Architecture Patterns
- **Multi-tenant**: All data scoped by `tenant_id`
- **Multi-language**: French (default), Arabic (RTL), English
- **Route Groups**: `(auth)` for public, `(dashboard)` for protected

---

## Code Style and Structure

### Naming Conventions
- **Directories**: lowercase with dashes (`components/auth-wizard/`)
- **Components**: PascalCase (`ProductForm.tsx` or `product-form.tsx`)
- **Hooks**: camelCase with `use` prefix (`useProducts`, `useTenant`)
- **Variables**: Descriptive with auxiliary verbs (`isLoading`, `hasError`, `canEdit`)

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Public routes (login, signup)
│   ├── (dashboard)/       # Protected routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── layout/            # Header, Sidebar, etc.
│   ├── products/          # Feature components
│   └── dashboard/         # Dashboard widgets
├── hooks/                 # Custom React hooks
│   └── use-*.ts          # Data fetching & state
├── lib/
│   ├── supabase/         # Supabase client config
│   ├── i18n/             # Internationalization
│   ├── utils.ts          # cn() utility
│   └── format.ts         # Formatting helpers
└── types/
    └── database.ts       # TypeScript interfaces
```

---

## React Component Patterns

### Server vs Client Components
```tsx
// DEFAULT: Server Component (no directive needed)
export default function ProductsPage() {
  // Can use async/await directly
}

// CLIENT: Only when needed for interactivity
'use client'
export function ProductForm() {
  const [state, setState] = useState()
  // Interactive UI, hooks, event handlers
}
```

**Use `'use client'` only for:**
- Form components with state
- Interactive UI (dialogs, dropdowns)
- Hooks that use useState/useEffect
- Event handlers (onClick, onChange)

### Component Template
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n'
import type { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
  onEdit?: (id: string) => void
  className?: string
}

export function ProductCard({ product, onEdit, className }: ProductCardProps) {
  const { t } = useLanguage()
  
  return (
    <div className={cn("p-4 border rounded-lg", className)}>
      {/* content */}
    </div>
  )
}
```

---

## Supabase Integration

### Client Setup
```tsx
// lib/supabase/client.ts - Browser client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts - Server client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(/* config */)
}
```

### Data Fetching Hook Pattern
```tsx
'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useProducts(tenantId: string | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!tenantId) return
    
    setIsLoading(true)
    setError(null)
    
    const supabase = createClient()
    const { data, error: queryError } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')

    if (queryError) {
      setError('Error loading products')
      console.error(queryError)
    } else {
      setProducts(data || [])
    }
    
    setIsLoading(false)
  }, [tenantId])

  return { products, isLoading, error, fetchProducts }
}
```

### Error Handling
```tsx
// Always handle Supabase errors gracefully
const { data, error } = await supabase.from('table').select()

if (error) {
  // PGRST116 = no rows found (not an error for single())
  if (error.code !== 'PGRST116') {
    console.error('Query error:', error)
    setError(t('error_loading_data'))
  }
  return null
}
```

---

## Internationalization (i18n)

### Language Context Usage
```tsx
import { useLanguage } from '@/lib/i18n'

export function MyComponent() {
  const { t, currentLanguage, isRTL } = useLanguage()
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('page_title')}</h1>
      <Button>{t('save')}</Button>
    </div>
  )
}
```

### Translation Keys
- Use snake_case for keys: `product_not_found`, `add_variant`
- Group by feature in translation objects
- Always provide all 3 languages (fr, ar, en)

### RTL Support
```tsx
// Use RTL-aware classes
<Icon className="mr-2 rtl:ml-2 rtl:mr-0" />

// Use logical properties when possible
<div className="ps-4 pe-2"> {/* padding-start, padding-end */}

// Rotate directional icons for RTL
<ChevronRight className="rtl:rotate-180" />
```

---

## Multi-Tenancy

### Always Scope by Tenant
```tsx
// Every query MUST include tenant_id filter
const { currentTenant } = useTenant()

const { data } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', currentTenant?.id) // Required!
  .order('name')

// Every insert MUST include tenant_id
await supabase.from('products').insert({
  tenant_id: currentTenant?.id, // Required!
  name: formData.name,
  // ...
})
```

---

## UI Patterns

### Styling with cn()
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "base-styles",
  isActive && "active-styles",
  className
)} />
```

### Loading States
```tsx
if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
```

### Empty States
```tsx
if (items.length === 0) {
  return (
    <div className="text-center py-12">
      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{t('no_items')}</p>
      <Button variant="outline" className="mt-4">
        {t('create_first')}
      </Button>
    </div>
  )
}
```

### Form Pattern
```tsx
const [formData, setFormData] = useState<FormData>(defaultFormData)
const [isSubmitting, setIsSubmitting] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!formData.name.trim()) return
  
  setIsSubmitting(true)
  // ... submit logic
  setIsSubmitting(false)
}

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
  {t('save')}
</Button>
```

---

## Dark Mode

### Theme Provider
```tsx
// Already configured in components/theme-provider.tsx
import { ThemeProvider } from '@/components/theme-provider'

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### Theme-Aware Colors
- Use Tailwind semantic colors: `bg-background`, `text-foreground`
- Use `bg-muted`, `text-muted-foreground` for secondary elements
- Avoid hardcoded colors like `bg-white`, `text-black`

---

## Performance

### Dynamic Imports
```tsx
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false
})
```

### Image Optimization
```tsx
import Image from 'next/image'

// For Supabase Storage images
<Image
  src={product.image || '/placeholder.jpg'}
  alt={product.name}
  width={200}
  height={200}
  className="object-cover rounded-lg"
/>
```

---

## Error Handling

### Early Returns
```tsx
export function ProductPage({ id }: { id: string }) {
  const { product, isLoading, error } = useProduct(id)
  
  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />
  if (!product) return <NotFound message={t('product_not_found')} />
  
  return <ProductDetails product={product} />
}
```

### Guard Clauses
```tsx
const handleSave = async (data: FormData) => {
  if (!data.name?.trim()) return
  if (!currentTenant?.id) return
  if (isSubmitting) return
  
  // ... proceed with save
}
```

---

## TypeScript

### Interface Definitions
```tsx
// types/database.ts
export interface Product {
  id: string
  tenant_id: string
  name: string
  price: number
  type: 'simple' | 'variable' | 'composite'
  // ...
}

// Component props
interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => Promise<boolean>
  isLoading?: boolean
}
```

### Strict Type Safety
- No `any` types (use `unknown` if needed)
- Use type guards for runtime checks
- Define explicit return types for functions

---

## Methodology

1. **Analyze**: Understand requirements, check existing patterns
2. **Plan**: Consider data flow, state management, i18n needs
3. **Implement**: Follow established patterns, use existing hooks
4. **Review**: Check tenant scoping, i18n, error handling
5. **Test**: Verify in all languages, check dark mode, test loading states
