'use client'

import { type ReactNode, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Search, Menu } from 'lucide-react'
import { navigationItems } from './sidebar-nav'
import { CommandPaletteTrigger } from '@/components/ui/command-palette'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserMenu } from '@/components/auth/user-menu'

interface AppHeaderProps {
  currentView: string
  onOpenSidebar: () => void
  onOpenCommandPalette: () => void
  onNavigate: (view: string) => void
}

export function AppHeader({
  currentView,
  onOpenSidebar,
  onOpenCommandPalette,
  onNavigate,
}: AppHeaderProps) {
  // Memoize date label — recalculates only once per day
  const dateLabel = useMemo(() => new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }), [])

  // Find active nav item for mobile header
  const activeNav = navigationItems.find(n => n.id === currentView)
  const ActiveIcon = activeNav?.icon

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 lg:h-20">
      <div
        className="flex items-center justify-between h-full mx-2 sm:mx-3 lg:mx-4 mt-2 sm:mt-3 lg:mt-4 relative overflow-hidden bg-surface border-border"
        style={{
          boxShadow: '0 2px 12px var(--shadow-sm)',
        }}
      >
        {/* Water waves pattern */}
        <WaterWavesPattern />

        {/* Content */}
        <div className="flex items-center justify-between w-full px-3 sm:px-4 lg:px-6 relative z-10">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 shrink-0"
              style={{ color: 'var(--primary)' }}
              onClick={onOpenSidebar}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Vista activa en mobile */}
            <div className="lg:hidden flex items-center gap-2">
              {ActiveIcon && <ActiveIcon className="w-4 h-4" style={{ color: 'var(--secondary)' }} />}
              <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                {activeNav?.name ?? 'Dashboard'}
              </span>
            </div>

            {/* Search trigger — solo desktop */}
            <div className="hidden lg:block">
              <CommandPaletteTrigger onClick={onOpenCommandPalette} />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search en mobile */}
            <button
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg transition-colors hover:bg-secondary/20 text-primary"
              onClick={onOpenCommandPalette}
            >
              <Search className="w-4 h-4" />
            </button>
            <span
              className="hidden md:block text-sm font-medium"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {dateLabel}
            </span>
            <ThemeToggle />
            <UserMenu onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </header>
  )
}

/* ============================================
   WATER WAVES SVG PATTERN
   ============================================ */
function WaterWavesPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="headerWaterWaves" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M0 50 Q 25 25, 50 50 T 100 50 T 150 50 T 200 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
            className="text-primary/40 dark:text-primary/30"
          />
          <path
            d="M0 70 Q 25 45, 50 70 T 100 70 T 150 70 T 200 70"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
            className="text-secondary/40 dark:text-secondary/30"
          />
          <path
            d="M0 30 Q 25 55, 50 30 T 100 30 T 150 30 T 200 30"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.15"
            className="text-primary/30 dark:text-primary/20"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#headerWaterWaves)" />
    </svg>
  )
}