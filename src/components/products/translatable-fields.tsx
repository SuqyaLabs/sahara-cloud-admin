'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Globe, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguages } from '@/hooks/use-languages'
import { useProductTranslations } from '@/hooks/use-product-translations'
import type { ProductTranslation } from '@/types/database'

interface TranslationData {
  name: string
  short_description: string | null
  long_description: string | null
}

interface TranslatableFieldsProps { 
  productId?: string
  defaultName: string
  defaultDescription: string | null
  onDefaultNameChange: (name: string) => void
  onDefaultDescriptionChange: (description: string | null) => void
  onTranslationsChange?: (translations: Record<string, TranslationData>) => void
  isEditing: boolean
}

export function TranslatableFields({
  productId,
  defaultName,
  defaultDescription,
  onDefaultNameChange,
  onDefaultDescriptionChange,
  onTranslationsChange,
  isEditing,
}: TranslatableFieldsProps) {
  const { activeLanguages, defaultLanguage, isLoading: languagesLoading } = useLanguages()
  const { fetchTranslations } = useProductTranslations()
  
  const [activeTab, setActiveTab] = useState<string>('')
  const [translations, setTranslations] = useState<Record<string, TranslationData>>({})
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Refs to prevent re-render loops
  const hasFetchedRef = useRef(false)
  const defaultLangCodeRef = useRef<string | null>(null)

  // Update ref when default language changes
  useEffect(() => {
    if (defaultLanguage?.code) {
      defaultLangCodeRef.current = defaultLanguage.code
    }
  }, [defaultLanguage?.code])

  // Initialize active tab when languages load (only once)
  useEffect(() => {
    if (activeLanguages.length > 0 && !activeTab) {
      const defaultLang = defaultLanguage?.code || activeLanguages[0]?.code
      setActiveTab(defaultLang)
    }
  }, [activeLanguages.length, defaultLanguage?.code, activeTab])

  // Load existing translations when editing (only once per productId)
  useEffect(() => {
    if (isEditing && productId && activeLanguages.length > 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      setIsLoadingTranslations(true)
      
      fetchTranslations(productId).then((data) => {
        const translationsMap: Record<string, TranslationData> = {}
        
        // Initialize with empty data for all active languages
        activeLanguages.forEach(lang => {
          translationsMap[lang.code] = {
            name: '',
            short_description: null,
            long_description: null,
          }
        })
        
        // Fill in existing translations from database
        data.forEach((t: ProductTranslation) => {
          if (translationsMap[t.language_code] !== undefined) {
            translationsMap[t.language_code] = {
              name: t.name,
              short_description: t.short_description,
              long_description: t.long_description,
            }
          }
        })
        
        setTranslations(translationsMap)
        setIsLoadingTranslations(false)
        setIsInitialized(true)
        
        // Notify parent of loaded translations
        onTranslationsChange?.(translationsMap)
      })
    }
  }, [isEditing, productId, activeLanguages.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize translations for new products (only once)
  useEffect(() => {
    if (!isEditing && activeLanguages.length > 0 && !isInitialized) {
      const translationsMap: Record<string, TranslationData> = {}
      const defLangCode = defaultLanguage?.code
      
      activeLanguages.forEach(lang => {
        translationsMap[lang.code] = {
          name: lang.code === defLangCode ? defaultName : '',
          short_description: lang.code === defLangCode ? defaultDescription : null,
          long_description: null,
        }
      })
      
      setTranslations(translationsMap)
      setIsInitialized(true)
    }
  }, [isEditing, activeLanguages.length > 0, isInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateTranslation = useCallback((langCode: string, field: keyof TranslationData, value: string | null) => {
    setTranslations(prev => {
      const updated = {
        ...prev,
        [langCode]: {
          ...prev[langCode],
          [field]: value,
        },
      }
      
      // If updating default language, also update the main form fields
      if (langCode === defaultLangCodeRef.current) {
        if (field === 'name') {
          onDefaultNameChange(value || '')
        } else if (field === 'short_description') {
          onDefaultDescriptionChange(value)
        }
      }
      
      onTranslationsChange?.(updated)
      return updated
    })
  }, [onDefaultNameChange, onDefaultDescriptionChange, onTranslationsChange])

  if (languagesLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // If only one language, show simple form without tabs
  if (activeLanguages.length <= 1) {
    return (
      <div className="bg-card rounded-lg border border-border p-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Titre
          </Label>
          <Input
            id="name"
            value={defaultName}
            onChange={(e) => onDefaultNameChange(e.target.value)}
            placeholder="Nom du produit"
            className="h-10"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="description"
            value={defaultDescription || ''}
            onChange={(e) => onDefaultDescriptionChange(e.target.value || null)}
            placeholder="Décrivez votre produit en détail..."
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Une bonne description aide les clients à comprendre votre produit.
          </p>
        </div>
      </div>
    )
  }

  const currentLang = activeLanguages.find(l => l.code === activeTab)
  const currentTranslation = translations[activeTab] || { name: '', short_description: null, long_description: null }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Language Tabs */}
      <div className="flex items-center gap-1 p-2 bg-muted/30 border-b border-border overflow-x-auto">
        <Globe className="w-4 h-4 text-muted-foreground ml-2 mr-1 shrink-0" />
        {activeLanguages.map((lang) => {
          const trans = translations[lang.code]
          const isEmpty = !trans?.name?.trim()
          const isDefault = lang.code === defaultLanguage?.code
          
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveTab(lang.code)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0',
                activeTab === lang.code
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <span className={lang.is_rtl ? 'font-arabic' : ''}>{lang.native_name}</span>
              {isDefault && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  Défaut
                </Badge>
              )}
              {!isDefault && isEmpty && (
                <AlertCircle className="w-3 h-3 text-amber-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4" dir={currentLang?.is_rtl ? 'rtl' : 'ltr'}>
        {isLoadingTranslations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={`name-${activeTab}`} className="text-sm font-medium">
                Titre ({currentLang?.native_name})
              </Label>
              <Input
                id={`name-${activeTab}`}
                value={currentTranslation.name}
                onChange={(e) => updateTranslation(activeTab, 'name', e.target.value)}
                placeholder={`Nom du produit en ${currentLang?.name?.toLowerCase()}`}
                className={cn('h-10', currentLang?.is_rtl && 'text-right')}
                required={activeTab === defaultLanguage?.code}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`description-${activeTab}`} className="text-sm font-medium">
                Description ({currentLang?.native_name})
              </Label>
              <Textarea
                id={`description-${activeTab}`}
                value={currentTranslation.short_description || ''}
                onChange={(e) => updateTranslation(activeTab, 'short_description', e.target.value || null)}
                placeholder={`Description en ${currentLang?.name?.toLowerCase()}...`}
                rows={6}
                className={cn('resize-none', currentLang?.is_rtl && 'text-right')}
              />
              <p className="text-xs text-muted-foreground">
                {activeTab === defaultLanguage?.code 
                  ? 'Une bonne description aide les clients à comprendre votre produit.'
                  : `Laissez vide pour utiliser la description en ${defaultLanguage?.native_name}.`
                }
              </p>
            </div>

            {/* Translation Status */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {activeLanguages.map((lang) => {
                const trans = translations[lang.code]
                const hasName = trans?.name?.trim()
                const isDefault = lang.code === defaultLanguage?.code
                
                return (
                  <Badge
                    key={lang.code}
                    variant={hasName ? 'secondary' : 'outline'}
                    className={cn(
                      'text-xs',
                      !hasName && !isDefault && 'border-amber-500/50 text-amber-600'
                    )}
                  >
                    {lang.code.toUpperCase()}
                    {hasName ? ' ✓' : isDefault ? '' : ' ○'}
                  </Badge>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export type { TranslationData }
