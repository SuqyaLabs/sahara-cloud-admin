'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Commandes', href: '/orders', icon: ShoppingCart },
  { name: 'Produits', href: '/products', icon: Package },
  { name: 'Rapports', href: '/reports', icon: FileText },
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-background transition-all duration-300',
          // Desktop: normal sidebar
          'hidden lg:flex',
          isCollapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile: slide-in drawer
          isMobileOpen && 'fixed inset-y-0 left-0 z-50 flex w-64 lg:relative lg:z-auto'
        )}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <span className="font-semibold text-sm">SaharaOS</span>
          )}
        </div>
        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-md hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              title={isCollapsed && !isMobileOpen ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Button - Desktop only */}
      <div className="hidden lg:block p-3 border-t border-border">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-full py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="text-sm">Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  )
}
