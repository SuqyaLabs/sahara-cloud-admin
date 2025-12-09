'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { TenantSwitcher } from './tenant-switcher'
import { useTenant } from '@/hooks/use-tenant'
import { User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react'

interface HeaderProps {
  onMobileMenuClick?: () => void
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const router = useRouter()
  const { tenants, currentTenant, setCurrentTenant, isLoading } = useTenant()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ email: user.email || '' })
      }
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-border bg-card px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <TenantSwitcher
        tenants={tenants}
        currentTenant={currentTenant}
        onSelect={setCurrentTenant}
        isLoading={isLoading}
      />

      <div className="flex items-center gap-4">
        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md',
              'hover:bg-accent transition-colors text-sm'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="hidden md:block text-muted-foreground max-w-[150px] truncate">
              {user?.email}
            </span>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isUserMenuOpen && 'rotate-180'
            )} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 rounded-md border border-border bg-zinc-900 shadow-lg z-50 animate-fade-in">
              <div className="p-2 border-b border-border">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Propriétaire</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    router.push('/settings')
                    setIsUserMenuOpen(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Paramètres
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
