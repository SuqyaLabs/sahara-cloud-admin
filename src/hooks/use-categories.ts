'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/database'

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
  productCount?: number
}

interface UseCategoriesReturn {
  categories: Category[]
  categoryTree: CategoryWithChildren[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  createCategory: (data: CreateCategoryData) => Promise<Category | null>
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<boolean>
  deleteCategory: (id: string) => Promise<boolean>
}

interface CreateCategoryData {
  name: string
  type: 'retail' | 'hospitality' | 'service'
  parent_id?: string | null
}

interface UpdateCategoryData {
  name?: string
  type?: 'retail' | 'hospitality' | 'service'
  parent_id?: string | null
}

function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const categoryMap = new Map<string, CategoryWithChildren>()
  const roots: CategoryWithChildren[] = []

  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  categories.forEach(cat => {
    const current = categoryMap.get(cat.id)!
    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      const parent = categoryMap.get(cat.parent_id)!
      parent.children = parent.children || []
      parent.children.push(current)
    } else {
      roots.push(current)
    }
  })

  return roots
}

export function useCategories(tenantId: string | null): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error: queryError } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name')

      if (queryError) {
        setError('Erreur lors du chargement des catégories')
        console.error(queryError)
      } else {
        setCategories((data as Category[]) || [])
      }
    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsLoading(false)
  }, [tenantId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = useCallback(async (data: CreateCategoryData): Promise<Category | null> => {
    if (!tenantId) return null

    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newCategory, error } = await (supabase as any)
      .from('categories')
      .insert({
        tenant_id: tenantId,
        name: data.name,
        type: data.type,
        parent_id: data.parent_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return null
    }

    setCategories(prev => [...prev, newCategory as Category].sort((a, b) => a.name.localeCompare(b.name)))
    return newCategory as Category
  }, [tenantId])

  const updateCategory = useCallback(async (id: string, data: UpdateCategoryData): Promise<boolean> => {
    const supabase = createClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('categories')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating category:', error)
      return false
    }

    setCategories(prev => prev.map(c => 
      c.id === id ? { ...c, ...updateData } as Category : c
    ).sort((a, b) => a.name.localeCompare(b.name)))
    
    return true
  }, [])

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    const supabase = createClient()

    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      setError(`Cette catégorie contient ${count} produit(s). Veuillez d'abord les réassigner.`)
      return false
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return false
    }

    setCategories(prev => prev.filter(c => c.id !== id))
    return true
  }, [])

  const categoryTree = buildCategoryTree(categories)

  return {
    categories,
    categoryTree,
    isLoading,
    error,
    refresh: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
