'use client'

import { useEffect, useCallback, useRef } from 'react'

type ShortcutKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | '/' | '?' | 'Escape' | 'Enter' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Backspace' | 'Delete'

export interface ShortcutConfig {
  key: ShortcutKey | string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  action: () => void
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts: ShortcutConfig[]
  preventDefault?: boolean
}

/**
 * useKeyboardShortcuts - Hook for managing keyboard shortcuts
 * 
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'n', ctrl: true, description: 'New client', action: () => setShowForm(true) },
 *     { key: '/', description: 'Focus search', action: () => searchInputRef.current?.focus() },
 *     { key: '1', description: 'Go to Dashboard', action: () => navigate('dashboard') },
 *   ]
 * })
 */
export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
  preventDefault = true,
}: UseKeyboardShortcutsOptions) {
  // Store shortcuts in a ref but update it inside an effect
  const shortcutsRef = useRef(shortcuts)
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const target = event.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() || 
                        event.code.toLowerCase() === shortcut.key.toLowerCase()
        
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey

        // For '/' and other special keys, allow in inputs too
        const allowInInput = ['Escape', 'Enter'].includes(shortcut.key) || shortcut.ctrl || shortcut.meta

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (isInput && !allowInInput) continue

          if (preventDefault) {
            event.preventDefault()
          }
          shortcut.action()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, preventDefault])
}

/**
 * useGlobalNavigation - Navigation shortcuts (1-6)
 */
export function useGlobalNavigation(
  navigate: (view: string) => void,
  views: Array<{ key: string; label: string; shortcut: string }>
) {
  useKeyboardShortcuts({
    shortcuts: views.map((view) => ({
      key: view.shortcut,
      description: `Go to ${view.label}`,
      action: () => navigate(view.key),
    })),
  })
}

/**
 * CommonShortcuts - Predefined shortcuts for NMS
 */
export function useNMSShortcuts({
  onNewClient,
  onSearch,
  onDashboard,
  onClients,
  onAttendance,
  onPayments,
  onSettings,
  onEscape,
}: {
  onNewClient?: () => void
  onSearch?: () => void
  onDashboard?: () => void
  onClients?: () => void
  onAttendance?: () => void
  onPayments?: () => void
  onSettings?: () => void
  onEscape?: () => void
}) {
  const shortcuts: ShortcutConfig[] = []

  if (onNewClient) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      description: 'Nuevo cliente',
      action: onNewClient,
    })
  }

  if (onSearch) {
    shortcuts.push({
      key: '/',
      description: 'Buscar',
      action: onSearch,
    })
  }

  if (onDashboard) {
    shortcuts.push({
      key: '1',
      description: 'Ir a Dashboard',
      action: onDashboard,
    })
  }

  if (onClients) {
    shortcuts.push({
      key: '2',
      description: 'Ir a Clientes',
      action: onClients,
    })
  }

  if (onAttendance) {
    shortcuts.push({
      key: '3',
      description: 'Ir a Asistencias',
      action: onAttendance,
    })
  }

  if (onPayments) {
    shortcuts.push({
      key: '4',
      description: 'Ir a Pagos',
      action: onPayments,
    })
  }

  if (onSettings) {
    shortcuts.push({
      key: '5',
      description: 'Ir a Configuración',
      action: onSettings,
    })
  }

  if (onEscape) {
    shortcuts.push({
      key: 'Escape',
      description: 'Cerrar',
      action: onEscape,
    })
  }

  useKeyboardShortcuts({ shortcuts })

  return shortcuts
}
