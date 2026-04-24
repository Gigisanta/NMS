'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-10 w-10 rounded-full" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200',
        'hover:scale-105 active:scale-95',
        isDark ? 'hover:bg-[rgba(240,248,255,0.1)]' : 'hover:bg-[rgba(0,168,232,0.12)]'
      )}
      style={{ color: isDark ? 'var(--foreground-muted)' : 'var(--foreground-muted)' }}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            'absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out',
            !isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180 scale-50'
          )}
          style={{ color: 'var(--primary)' }}
        />
        <Moon
          className={cn(
            'absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out',
            isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180 scale-50'
          )}
          style={{ color: 'var(--secondary)' }}
        />
      </div>
    </button>
  )
}