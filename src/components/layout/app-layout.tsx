'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
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
  Menu,
  Waves as WavesIcon,
  UserCog,
  Search,
  Plus,
} from 'lucide-react'
import { UserMenu } from '@/components/auth/user-menu'
import { useSession } from 'next-auth/react'
import { CommandPalette, CommandPaletteTrigger } from '@/components/ui/command-palette'
import { useNMSShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface AppLayoutProps {
  children: React.ReactNode
  currentView: string
  onViewChange: (view: string) => void
  onNewClient?: () => void
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
  { id: 'clientes', name: 'Clientes', icon: Users, shortcut: '2' },
  { id: 'asistencias', name: 'Asistencias', icon: ClipboardCheck, shortcut: '3' },
  { id: 'pagos', name: 'Pagos', icon: CreditCard, shortcut: '4' },
  { id: 'facturacion', name: 'Facturación', icon: Receipt, shortcut: '5' },
  { id: 'calendario', name: 'Calendario', icon: CalendarDays, shortcut: '6' },
  { id: 'empleados', name: 'Empleados', icon: UserCog, adminOnly: true, shortcut: '7' },
  { id: 'configuracion', name: 'Configuración', icon: Settings, adminOnly: true, shortcut: '8' },
]

export function AppLayout({ children, currentView, onViewChange, onNewClient }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { data: session } = useSession()

  // Filter navigation based on role
  const filteredNavigation = useMemo(() => navigation.filter(item => {
    if (item.adminOnly && session?.user?.role !== 'EMPLEADORA') {
      return false
    }
    return true
  }), [session?.user?.role])

  // Command palette actions
  const commands = useMemo(() => [
    // Navigation
    ...filteredNavigation.map(item => ({
      id: `nav-${item.id}`,
      label: item.name,
      category: 'Navegación',
      icon: item.icon,
      shortcut: item.shortcut,
      action: () => onViewChange(item.id),
    })),
    // Quick actions
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
      icon: Search,
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

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-slate-200/60 transform transition-transform duration-200 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-900 rounded-md">
                <WavesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900">NMS</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-7 w-7 text-slate-400 hover:text-slate-600"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id)
                      setSidebarOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive 
                        ? "bg-slate-100 text-slate-900 font-medium" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] px-1 py-0.5 bg-slate-100 rounded font-mono text-slate-400 hidden lg:inline">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                )
              })}
            </nav>
          </ScrollArea>

          {/* User section in sidebar */}
          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-xs font-medium text-slate-600">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">
                  {session?.user?.name || 'Usuario'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {session?.user?.role === 'EMPLEADORA' ? 'Administrador' : 'Empleado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-12 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left side */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 text-slate-500"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-4 h-4" />
              </Button>

              {/* Search trigger */}
              <CommandPaletteTrigger onClick={() => setCommandPaletteOpen(true)} />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-xs text-slate-400">
                {new Date().toLocaleDateString('es-AR', { 
                  weekday: 'short', 
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 min-h-[calc(100vh-3rem)]">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        commands={commands}
        placeholder="Buscar acciones, navegación..."
      />
    </div>
  )
}
