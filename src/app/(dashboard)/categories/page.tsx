'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/hooks/use-tenant'
import { useCategories } from '@/hooks/use-categories'
import { useTranslations } from '@/hooks/use-translations'
import { useLanguage } from '@/lib/i18n'
import type { CategoryTranslation } from '@/lib/i18n/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { 
  Plus, 
  FolderTree, 
  Pencil, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import type { Category } from '@/types/database'

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

interface CategoryFormData {
  name: string
  type: 'retail' | 'hospitality' | 'service'
  parent_id: string | null
}

const defaultFormData: CategoryFormData = {
  name: '',
  type: 'hospitality',
  parent_id: null,
}

const typeOptions = [
  { value: 'hospitality', label: 'Restauration' },
  { value: 'retail', label: 'Commerce' },
  { value: 'service', label: 'Service' },
]

const typeLabels: Record<string, string> = {
  hospitality: 'Restauration',
  retail: 'Commerce',
  service: 'Service',
}

export default function CategoriesPage() {
  const { currentTenant } = useTenant()
  const { currentLanguage, t } = useLanguage()
  const { getCategoriesWithTranslations } = useTranslations()
  const {
    categories,
    categoryTree,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories(currentTenant?.id || null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [categoryTranslations, setCategoryTranslations] = useState<Map<string, CategoryTranslation>>(new Map())

  // Fetch translations when categories or language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      if (categories.length > 0) {
        const categoryIds = categories.map(c => c.id)
        const translations = await getCategoriesWithTranslations(categoryIds, currentLanguage)
        setCategoryTranslations(translations)
      }
    }
    fetchTranslations()
  }, [categories, currentLanguage, getCategoriesWithTranslations])

  // Helper to get translated category name
  const getCategoryName = (categoryId: string, fallback: string) => {
    const translation = categoryTranslations.get(categoryId)
    return translation?.name || fallback
  }
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const parentOptions = [
    { value: '', label: 'Aucune (catégorie racine)' },
    ...categories
      .filter(c => !editingCategory || c.id !== editingCategory.id)
      .map(c => ({ value: c.id, label: c.name })),
  ]

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setFormData(defaultFormData)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type as 'retail' | 'hospitality' | 'service',
      parent_id: category.parent_id,
    })
    setIsFormOpen(true)
  }

  const handleOpenDelete = (category: Category) => {
    setDeletingCategory(category)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: formData.name.trim(),
        type: formData.type,
        parent_id: formData.parent_id || null,
      })
    } else {
      await createCategory({
        name: formData.name.trim(),
        type: formData.type,
        parent_id: formData.parent_id || null,
      })
    }

    setIsSubmitting(false)
    setIsFormOpen(false)
    setFormData(defaultFormData)
    setEditingCategory(null)
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    setIsSubmitting(true)
    const success = await deleteCategory(deletingCategory.id)
    setIsSubmitting(false)

    if (success) {
      setIsDeleteOpen(false)
      setDeletingCategory(null)
    }
  }

  const renderCategory = (category: CategoryWithChildren, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedIds.has(category.id)

    return (
      <div key={category.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-accent/50 rounded-md group"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="p-0.5 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <FolderTree className="w-4 h-4 text-primary" />
          
          <span className="flex-1 font-medium text-sm">{getCategoryName(category.id, category.name)}</span>
          
          <Badge variant="outline" className="text-xs">
            {typeLabels[category.type] || category.type}
          </Badge>
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(category)}
              className="h-7 w-7 p-0"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDelete(category)}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('categories')}</h1>
          <p className="text-muted-foreground text-sm">
            {categories.length} {t('categories').toLowerCase()}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3 flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Categories Tree */}
      <Card>
        <CardContent className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3">
                  <div className="w-5 h-5 animate-pulse rounded bg-muted" />
                  <div className="w-4 h-4 animate-pulse rounded bg-muted" />
                  <div className="flex-1 h-4 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('no_categories')}</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une catégorie
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categoryTree.map(category => renderCategory(category))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Modifiez les informations de la catégorie.'
                : 'Créez une nouvelle catégorie pour organiser vos produits.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom de la catégorie"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                options={typeOptions}
                value={formData.type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  type: e.target.value as 'retail' | 'hospitality' | 'service' 
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parent">Catégorie parente</Label>
              <Select
                options={parentOptions}
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  parent_id: e.target.value || null 
                })}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCategory ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie &quot;{deletingCategory?.name}&quot; ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
