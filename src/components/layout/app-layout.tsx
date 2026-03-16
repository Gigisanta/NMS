'use client'

import { useState, useCallback, useMemo, useEffect, memo } from 'react'
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
import { useViewPreloader } from '@/hooks/use-view-preloader'

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

/* ============================================
   WATER WAVES SVG PATTERN
   ============================================ */
const WaterWavesPattern = () => (
  <svg 
    className="absolute inset-0 w-full h-full pointer-events-none opacity-30" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="waterWaves" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
        <path 
          d="M0 50 Q 25 25, 50 50 T 100 50 T 150 50 T 200 50" 
          fill="none" 
          stroke="#005691" 
          strokeWidth="0.5" 
          opacity="0.3"
        />
        <path 
          d="M0 70 Q 25 45, 50 70 T 100 70 T 150 70 T 200 70" 
          fill="none" 
          stroke="#00A8E8" 
          strokeWidth="0.5" 
          opacity="0.2"
        />
        <path 
          d="M0 30 Q 25 55, 50 30 T 100 30 T 150 30 T 200 30" 
          fill="none" 
          stroke="#005691" 
          strokeWidth="0.5" 
          opacity="0.15"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#waterWaves)" />
  </svg>
)

export function AppLayout({ children, currentView, onViewChange, onNewClient }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { data: session } = useSession()
  const { handleMouseEnter, handleMouseLeave } = useViewPreloader()

  // Memoize date label — recalculates only once per day
  const dateLabel = useMemo(() => new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }), [])

  // Filter navigation based on role
  const filteredNavigation = useMemo(() => navigation.filter(item => {
    if (item.adminOnly && session?.user?.role !== 'EMPLEADORA') {
      return false
    }
    return true
  }), [session?.user?.role])

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
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
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
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
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
            background: 'linear-gradient(180deg, rgba(0, 86, 145, 0.85) 0%, rgba(0, 168, 232, 0.75) 100%)',
          }}
        />
        <div 
          className="flex flex-col h-full m-4"
          style={{
            background: 'linear-gradient(180deg, rgba(240, 248, 255, 0.95) 0%, rgba(255, 255, 255, 0.92) 100%)',
            border: '1px solid rgba(0, 168, 232, 0.25)',
            boxShadow: '0 4px 20px rgba(0, 86, 145, 0.15), 0 8px 30px rgba(0, 86, 145, 0.1)',
          }}
        >
          {/* Logo */}
          <div 
            className="flex items-center justify-between h-20 px-6"
            style={{ borderBottom: '1px solid rgba(0, 168, 232, 0.3)' }}
          >
            <div className="flex items-center gap-3">
              {/* Logo con gradiente Oro Azul */}
              <div 
                className="w-11 h-11 flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)',
                  boxShadow: '0 4px 15px rgba(0, 168, 232, 0.5)',
                }}
              >
                <WavesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <span 
                  className="text-lg font-bold block"
                  style={{ 
                    color: '#005691', 
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  NMS
                </span>
                <span className="text-[10px] font-medium" style={{ color: '#00A8E8' }}>
                  Natatorio
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              style={{ color: '#4A5568' }}
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-5">
            <nav className="space-y-1.5">
              {filteredNavigation.map((item, index) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id)
                      setSidebarOpen(false)
                    }}
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    onMouseLeave={() => handleMouseLeave(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-4 py-3 text-sm font-medium transition-all duration-300 animate-fade-slide-up",
                    )}
                    style={{
                      background: isActive 
                        ? 'rgba(255, 255, 255, 0.95)' 
                        : 'rgba(255, 255, 255, 0.6)',
                      color: isActive ? '#005691' : '#1A1A1A',
                      border: isActive ? '1px solid rgba(0, 168, 232, 0.5)' : '1px solid rgba(0, 168, 232, 0.15)',
                      boxShadow: isActive ? '0 2px 12px rgba(0, 168, 232, 0.2)' : 'none',
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <Icon 
                      className="w-5 h-5" 
                      style={{ color: isActive ? '#00A8E8' : '#4A5568' }}
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.shortcut && (
                      <kbd 
                        className="text-[11px] px-2.5 py-1 font-medium"
                        style={{ 
                          background: 'rgba(0, 168, 232, 0.1)', 
                          color: '#00A8E8' 
                        }}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                )
              })}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(0, 168, 232, 0.3)' }}>
            <div 
              className="flex items-center gap-3 px-4 py-3 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 168, 232, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 168, 232, 0.15)',
              }}
            >
              <div 
                className="w-10 h-10 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #00A8E8 0%, #005691 100%)',
                  boxShadow: '0 2px 10px rgba(0, 168, 232, 0.4)',
                }}
              >
                <span className="text-sm font-semibold text-white">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#1A1A1A' }}>
                  {session?.user?.name || 'Usuario'}
                </p>
                <p className="text-xs font-medium" style={{ color: '#00A8E8' }}>
                  {session?.user?.role === 'EMPLEADORA' ? 'Administrador' : 'Empleado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[300px]">
        {/* Top bar - Oro Azul Premium con ondas */}
        <header className="sticky top-0 z-30 h-20">
          <div 
            className="flex items-center justify-between h-full mx-4 mt-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 86, 145, 0.03) 0%, rgba(0, 168, 232, 0.05) 100%)',
              border: '1px solid rgba(0, 168, 232, 0.12)',
              boxShadow: '0 2px 12px rgba(0, 86, 145, 0.08)',
            }}
          >
            {/* Water waves pattern */}
            <WaterWavesPattern />
            
            {/* Content */}
            <div className="flex items-center justify-between w-full px-6 relative z-10">
              {/* Left side */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-10 w-10"
                  style={{ color: '#005691' }}
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Search trigger */}
                <CommandPaletteTrigger onClick={() => setCommandPaletteOpen(true)} />
              </div>

              {/* Right side */}
              <div className="flex items-center gap-5">
                <span 
                  className="hidden md:block text-sm font-medium"
                  style={{ color: '#4A5568' }}
                >
                  {dateLabel}
                </span>
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Page content with fade animation */}
        <main className="p-6 lg:p-8 min-h-[calc(100vh-6rem)] animate-fade-slide-up">
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
