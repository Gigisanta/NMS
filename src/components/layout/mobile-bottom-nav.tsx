'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  Menu,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MobileNavItem {
  id: string
  name: string
  icon: LucideIcon
}

const mobileNavItems: MobileNavItem[] = [
  { id: 'dashboard', name: 'Inicio', icon: LayoutDashboard },
  { id: 'clientes', name: 'Clientes', icon: Users },
  { id: 'asistencias', name: 'Asistencia', icon: ClipboardCheck },
  { id: 'pagos', name: 'Pagos', icon: CreditCard },
]

interface MobileBottomNavProps {
  currentView: string
  onViewChange: (view: string) => void
  onOpenSidebar?: () => void
}

export const MobileBottomNav = memo(function MobileBottomNav({
  currentView,
  onViewChange,
  onOpenSidebar,
}: MobileBottomNavProps) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -1px 12px var(--shadow-sm)',
      }}
    >
      <div className="flex items-stretch h-14">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors text-muted-foreground hover:text-primary"
              aria-label={item.name}
            >
              {isActive && (
                <span
                  className="absolute top-0 inset-x-[28%] h-0.5 rounded-b-full bg-gradient-to-r from-primary to-secondary"
                />
              )}
              <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] ${isActive ? 'font-semibold text-primary' : 'font-medium'}`}>{item.name}</span>
            </button>
          )
        })}
        {/* More — opens full sidebar */}
        <button
          onClick={onOpenSidebar}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors text-muted-foreground hover:text-primary"
          aria-label="Más opciones"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </div>
    </nav>
  )
})