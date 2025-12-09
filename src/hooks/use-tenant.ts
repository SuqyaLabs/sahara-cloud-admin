'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tenant } from '@/types/database'

interface TenantMembership {
  tenant_id: string
}

interface UseTenantReturn {
  tenants: Tenant[]
  currentTenant: Tenant | null
  isLoading: boolean
  error: string | null
  setCurrentTenant: (tenant: Tenant) => void
  refreshTenants: () => Promise<void>
}

const TENANT_STORAGE_KEY = 'sahara_current_tenant'

export function useTenant(): UseTenantReturn {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTenants = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Non authentifié')
        setIsLoading(false)
        return
      }

      // Get tenant memberships for the user
      const { data: memberships, error: membershipError } = await supabase
        .from('tenant_owners')
        .select('tenant_id')
        .eq('user_id', user.id)

      if (membershipError) {
        // If tenant_owners doesn't exist or user has no memberships,
        // fall back to getting all tenants (for demo purposes)
        const { data: allTenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('*')
          .order('name')

        if (tenantsError) {
          setError('Erreur lors du chargement des restaurants')
          setIsLoading(false)
          return
        }

        const tenantsData = (allTenants || []) as Tenant[]
        setTenants(tenantsData)
        
        // Restore last selected tenant or select first
        const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY)
        const storedTenant = tenantsData.find(t => t.id === storedTenantId)
        setCurrentTenantState(storedTenant || tenantsData[0] || null)
      } else {
        // Get tenants the user has access to
        const membershipData = (memberships || []) as TenantMembership[]
        const tenantIds = membershipData.map(m => m.tenant_id)
        
        if (tenantIds.length === 0) {
          // User has no tenant memberships, show all for demo
          const { data: allTenants } = await supabase
            .from('tenants')
            .select('*')
            .order('name')

          const tenantsData = (allTenants || []) as Tenant[]
          setTenants(tenantsData)
          const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY)
          const storedTenant = tenantsData.find(t => t.id === storedTenantId)
          setCurrentTenantState(storedTenant || tenantsData[0] || null)
        } else {
          const { data: userTenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('*')
            .in('id', tenantIds)
            .order('name')

          if (tenantsError) {
            setError('Erreur lors du chargement des restaurants')
            setIsLoading(false)
            return
          }

          const tenantsData = (userTenants || []) as Tenant[]
          setTenants(tenantsData)
          
          // Restore last selected tenant or select first
          const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY)
          const storedTenant = tenantsData.find(t => t.id === storedTenantId)
          setCurrentTenantState(storedTenant || tenantsData[0] || null)
        }
      }
    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  const setCurrentTenant = useCallback((tenant: Tenant) => {
    setCurrentTenantState(tenant)
    localStorage.setItem(TENANT_STORAGE_KEY, tenant.id)
  }, [])

  return {
    tenants,
    currentTenant,
    isLoading,
    error,
    setCurrentTenant,
    refreshTenants: fetchTenants,
  }
}
