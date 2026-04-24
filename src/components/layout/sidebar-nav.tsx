'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  Settings,
  Receipt,
  CalendarDays,
  Waves as WavesIcon,
  UserCog,
  Banknote,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'

export interface NavItem {
  id: string
  name: string
  icon: LucideIcon
  shortcut?: string
  adminOnly?: boolean
}

export const navigationItems: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
  { id: 'clientes', name: 'Clientes', icon: Users, shortcut: '2' },
  { id: 'asistencias', name: 'Asistencias', icon: ClipboardCheck, shortcut: '3' },
  { id: 'pagos', name: 'Pagos', icon: CreditCard, shortcut: '4' },
  { id: 'facturacion', name: 'Facturación', icon: Receipt, shortcut: '5' },
  { id: 'calendario', name: 'Calendario', icon: CalendarDays, shortcut: '6' },
  { id: 'empleados', name: 'Empleados', icon: UserCog, adminOnly: true, shortcut: '7' },
  { id: 'configuracion', name: 'Configuración', icon: Settings, adminOnly: true, shortcut: '8' },
  { id: 'gastos', name: 'Gastos', icon: Banknote, adminOnly: true, shortcut: '9' },
]

interface SidebarNavProps {
  currentView: string
  onViewChange: (view: string) => void
  onClose?: () => void
}

export const SidebarNav = memo(function SidebarNav({
  currentView,
  onViewChange,
  onClose,
}: SidebarNavProps) {
  const { data: session } = useSession()

  // Filter navigation based on role
  const filteredNavigation = navigationItems.filter(item => {
    if (item.adminOnly && session?.user?.role !== 'EMPLEADORA') {
      return false
    }
    return true
  })

  return (
    <nav className="space-y-1">
      {filteredNavigation.map((item) => {
        const Icon = item.icon
        const isActive = currentView === item.id
        return (
          <button
            key={item.id}
            onClick={() => {
              onViewChange(item.id)
              onClose?.()
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative",
              isActive
                ? "text-primary shadow-sm dark:text-primary-light"
                : "text-muted-foreground hover:text-primary dark:text-sidebar-foreground/70 dark:hover:text-primary sidebar-nav-inactive"
            )}
            style={{
              background: isActive
                ? 'var(--sidebar-accent)'
                : 'transparent',
              border: isActive
                ? '1px solid var(--sidebar-border)'
                : '1px solid transparent',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {/* Acento lateral activo */}
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-secondary"
              />
            )}
            <Icon
              className={cn(
                "w-4.5 h-4.5 shrink-0 transition-colors",
                isActive ? "text-secondary" : "text-muted-foreground group-hover:text-secondary dark:text-sidebar-foreground/50 dark:group-hover:text-secondary"
              )}
            />
            <span className="flex-1 text-left">{item.name}</span>
            {item.shortcut && (
              <kbd
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-mono transition-opacity bg-secondary/20 text-secondary",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                )}
              >
                {item.shortcut}
              </kbd>
            )}
          </button>
        )
      })}
    </nav>
  )
})

interface SidebarContentProps {
  currentView: string
  onViewChange: (view: string) => void
  onClose?: () => void
}

export function SidebarContent({ currentView, onViewChange, onClose }: SidebarContentProps) {
  const { data: session } = useSession()

  return (
    <>
      {/* Logo */}
      <div
        className="relative h-20 px-4 flex items-center justify-center border-b border-sidebar-border"
      >
        <img
          src="/logo-natatorio.png"
          alt="Oro Azul Natatorio"
          className="h-14 w-auto object-contain"
        />
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden absolute right-2 h-10 w-10 hover:bg-muted"
          style={{ color: 'var(--foreground-muted)' }}
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <SidebarNav
          currentView={currentView}
          onViewChange={onViewChange}
          onClose={onClose}
        />
      </ScrollArea>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-sidebar-accent/50 border border-sidebar-border"
        >
          <div
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary"
            style={{
              boxShadow: '0 2px 10px var(--shadow-md)',
            }}
          >
            <span className="text-sm font-semibold text-primary-foreground">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {session?.user?.name || 'Usuario'}
            </p>
            <p className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>
              {session?.user?.role === 'EMPLEADORA' ? 'Administrador' : 'Empleado'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}