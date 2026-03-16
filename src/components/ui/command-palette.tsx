'use client'

import { useState, useEffect, useCallback, useMemo, forwardRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Search, Loader2, ArrowRight, Command } from 'lucide-react'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
  category?: string
}

interface CommandPaletteProps {
  commands: CommandItem[]
  placeholder?: string
  emptyMessage?: string
}

/**
 * CommandPalette - Quick action search (Cmd+K)
 */
export function CommandPalette({
  commands,
  placeholder = 'Buscar acciones...',
  emptyMessage = 'No se encontraron acciones',
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter commands by search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands
    
    const query = search.toLowerCase()
    return commands.filter(
      cmd =>
        cmd.label.toLowerCase().includes(query) ||
        cmd.description?.toLowerCase().includes(query) ||
        cmd.category?.toLowerCase().includes(query)
    )
  }, [commands, search])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    
    filteredCommands.forEach(cmd => {
      const category = cmd.category || 'Acciones'
      if (!groups[category]) groups[category] = []
      groups[category].push(cmd)
    })
    
    return groups
  }, [filteredCommands])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'k',
        ctrl: true,
        description: 'Abrir búsqueda',
        action: () => setOpen(true),
      },
    ],
  })

  // Execute command - defined before it's used
  const executeCommand = useCallback((cmd: CommandItem) => {
    setOpen(false)
    cmd.action()
  }, [])

  // Reset state when opening - using a separate handler
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [])

  // Navigate with arrows
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        executeCommand(filteredCommands[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, filteredCommands, executeCommand])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-lg">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-base"
            autoFocus
          />
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>

        {/* Results */}
        {filteredCommands.length > 0 ? (
          <ScrollArea className="max-h-80">
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-xs font-medium text-slate-400 bg-slate-50">
                    {category}
                  </div>
                  {items.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const Icon = cmd.icon
                    
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                          globalIndex === selectedIndex
                            ? 'bg-cyan-50 text-cyan-900'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        {Icon && (
                          <Icon className={cn(
                            'w-4 h-4 flex-shrink-0',
                            globalIndex === selectedIndex ? 'text-cyan-600' : 'text-slate-400'
                          )} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-slate-500 truncate">{cmd.description}</div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className={cn(
                            'px-1.5 py-0.5 text-[10px] font-mono rounded',
                            globalIndex === selectedIndex
                              ? 'bg-cyan-100 text-cyan-700'
                              : 'bg-slate-100 text-slate-500'
                          )}>
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-400 border-t bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-200 rounded">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-200 rounded">↵</kbd>
              seleccionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-200 rounded">esc</kbd>
              cerrar
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * CommandPaletteTrigger - Button to open command palette
 */
export const CommandPaletteTrigger = forwardRef<HTMLButtonElement, { onClick: () => void }>(
  ({ onClick }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Buscar...</span>
      <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-slate-400">
        <Command className="w-3 h-3" />K
      </kbd>
    </button>
  )
)
CommandPaletteTrigger.displayName = 'CommandPaletteTrigger'
