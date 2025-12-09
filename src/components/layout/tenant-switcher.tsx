'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check, Building2 } from 'lucide-react'
import type { Tenant } from '@/types/database'

interface TenantSwitcherProps {
  tenants: Tenant[]
  currentTenant: Tenant | null
  onSelect: (tenant: Tenant) => void
  isLoading?: boolean
}

export function TenantSwitcher({ 
  tenants, 
  currentTenant, 
  onSelect, 
  isLoading 
}: TenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading) {
    return (
      <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
    )
  }

  if (tenants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span>Aucun restaurant</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md border border-border bg-background',
          'hover:bg-accent transition-colors text-sm font-medium',
          'min-w-0 sm:min-w-[180px] lg:min-w-[200px] justify-between'
        )}
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[100px] sm:max-w-[120px] lg:max-w-[150px]">
            {currentTenant?.name || 'Sélectionner'}
          </span>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground transition-transform shrink-0',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] rounded-md border border-border bg-zinc-900 shadow-xl z-50 animate-fade-in">
          <div className="p-1">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  onSelect(tenant)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2 rounded-md text-sm',
                  'hover:bg-accent transition-colors text-left',
                  currentTenant?.id === tenant.id && 'bg-accent'
                )}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{tenant.name}</span>
                  {tenant.business_name && tenant.business_name !== tenant.name && (
                    <span className="text-xs text-muted-foreground">{tenant.business_name}</span>
                  )}
                </div>
                {currentTenant?.id === tenant.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
