'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hydration mismatch — el toggle solo renderiza después de mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Placeholder estático durante SSR/hydration para evitar layout shift
    return (
      <div className="h-10 w-10 rounded-full" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200',
        'hover:scale-105 active:scale-95',
        isDark
          ? 'hover:bg-[rgba(240,248,255,0.1)]'
          : 'hover:bg-[rgba(0,168,232,0.12)]'
      )}
      style={{
        color: isDark ? '#8BA4BC' : '#4A5568',
      }}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {/* Icono que rota 180° con transición */}
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            'absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out',
            !isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180 scale-50'
          )}
          style={{ color: '#005691' }}
        />
        <Moon
          className={cn(
            'absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out',
            isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180 scale-50'
          )}
          style={{ color: '#00A8E8' }}
        />
      </div>
    </button>
  )
}