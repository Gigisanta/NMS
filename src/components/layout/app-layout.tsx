'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

import { useNMSShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useViewPreloader } from '@/hooks/use-view-preloader'
import { SidebarContent, navigationItems } from './sidebar-nav'
import { MobileBottomNav } from './mobile-bottom-nav'
import { AppHeader } from './app-header'
import { CommandPalette } from '@/components/ui/command-palette'

interface AppLayoutProps {
  children: React.ReactNode
  currentView: string
  onViewChange: (view: string) => void
  onNewClient?: () => void
}

export function AppLayout({ children, currentView, onViewChange, onNewClient }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [loadBarKey, setLoadBarKey] = useState(0)
  const { handleMouseEnter, handleMouseLeave } = useViewPreloader()

  // Filter navigation based on role for command palette
  const filteredNavigation = useMemo(() => navigationItems.filter(item => {
    if (item.adminOnly) {
      // We can't access session directly here, so we'll filter on the user role
      // passed through the command palette handler
      return true
    }
    return true
  }), [])

  // Command palette actions
  const commands = useMemo(() => [
    ...filteredNavigation.map(item => ({
      id: `nav-${item.id}`,
      label: item.name,
      category: 'Navegación',
      icon: item.icon,
      shortcut: item.shortcut,
      action: () => onViewChange(item.id),
    })),
    ...(onNewClient ? [{
      id: 'new-client',
      label: 'Nuevo Cliente',
      category: 'Acciones rápidas',
      icon: Plus,
      shortcut: '⌘N',
      action: () => {
        onNewClient()
        onViewChange('clientes')
      },
    }] : []),
    {
      id: 'search',
      label: 'Buscar cliente',
      category: 'Acciones rápidas',
      icon: Plus,
      shortcut: '/',
      action: () => onViewChange('clientes'),
    },
  ].flat(), [filteredNavigation, onViewChange, onNewClient])

  // Keyboard shortcuts
  useNMSShortcuts({
    onNewClient: onNewClient ? () => {
      onNewClient()
      onViewChange('clientes')
    } : undefined,
    onSearch: () => setCommandPaletteOpen(true),
    onDashboard: () => onViewChange('dashboard'),
    onClients: () => onViewChange('clientes'),
    onAttendance: () => onViewChange('asistencias'),
    onPayments: () => onViewChange('pagos'),
    onSettings: () => onViewChange('configuracion'),
    onEscape: () => setCommandPaletteOpen(false),
  })

  // Listen for custom event to open command palette
  useEffect(() => {
    const handleOpenCommandPalette = () => setCommandPaletteOpen(true)
    window.addEventListener('open-command-palette', handleOpenCommandPalette)
    return () => window.removeEventListener('open-command-palette', handleOpenCommandPalette)
  }, [])

  // Navigation change handler with load bar animation
  const handleNavChange = useCallback((view: string) => {
    if (currentView !== view) {
      setLoadBarKey(k => k + 1)
    }
    onViewChange(view)
  }, [currentView, onViewChange])

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Barra de progreso al cambiar vista */}
      {loadBarKey > 0 && <div key={loadBarKey} className="view-load-bar" aria-hidden="true" />}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Oro Azul Premium */}
      <aside
        style={{ willChange: 'transform' }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(288px,85vw)] transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Imagen de fondo profesional */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage: 'url(/sidebar-bg.jfif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.08,
          }}
        />
        {/* Overlay para oscurecer y mejorar contraste */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, oklch(from var(--primary) calc(l + 0.15) c h / 0.85) 0%, oklch(from var(--secondary) calc(l + 0.15) c h / 0.75) 100%)',
          }}
        />
        <div
          className="flex flex-col h-full m-4 bg-sidebar text-sidebar-foreground border-sidebar-border"
          style={{
            border: '1px solid var(--sidebar-border)',
            boxShadow: '0 4px 20px var(--shadow-md), 0 8px 30px var(--shadow-lg)',
          }}
        >
          <SidebarContent
            currentView={currentView}
            onViewChange={handleNavChange}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[300px]">
        {/* Top bar */}
        <AppHeader
          currentView={currentView}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onNavigate={onViewChange}
        />

        {/* Page content with fade animation */}
        <main className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 min-h-[calc(100vh-6rem)] animate-fade-slide-up">
          {children}
        </main>
      </div>

      {/* Mobile FAB — Nuevo Cliente (only on 'clientes' view) */}
      {onNewClient && currentView === 'clientes' && (
        <button
          onClick={() => {
            onNewClient()
            onViewChange('clientes')
          }}
          className="lg:hidden fixed right-4 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 gradient-oro-azul"
          style={{
            bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)',
            boxShadow: '0 4px 20px var(--shadow-lg)',
          }}
          aria-label="Nuevo cliente"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onViewChange={handleNavChange}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* Command Palette */}
      <CommandPalette
        commands={commands}
        placeholder="Buscar acciones, navegación..."
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  )
}