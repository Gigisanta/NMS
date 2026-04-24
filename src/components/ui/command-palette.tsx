'use client'

import { useState, useEffect, useCallback, useMemo, forwardRef, useRef } from 'react'
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
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * CommandPalette - Quick action search (Cmd+K)
 */
export function CommandPalette({
  commands,
  placeholder = 'Buscar acciones...',
  emptyMessage = 'No se encontraron acciones',
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const onOpenChangeRef = useRef(onOpenChange)
  useEffect(() => { onOpenChangeRef.current = onOpenChange }, [onOpenChange])

  const setOpen = useCallback((value: boolean) => {
    setInternalOpen(value)
    onOpenChangeRef.current?.(value)
  }, [])

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

  // Execute command
  const executeCommand = useCallback((cmd: CommandItem) => {
    setOpen(false)
    cmd.action()
  }, [setOpen])

  // Reset state when opening
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [setOpen])

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
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-base"
            autoFocus
          />
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>

        {/* Results */}
        {filteredCommands.length > 0 ? (
          <ScrollArea className="max-h-80">
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
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
                            ? 'bg-accent text-accent-foreground'
                            : 'text-foreground hover:bg-muted/50'
                        )}
                      >
                        {Icon && (
                          <Icon className={cn(
                            'w-4 h-4 flex-shrink-0',
                            globalIndex === selectedIndex ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className={cn(
                            'px-1.5 py-0.5 text-[10px] font-mono rounded',
                            globalIndex === selectedIndex
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
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
          <div className="py-8 text-center text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t bg-muted/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded">↵</kbd>
              seleccionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded">esc</kbd>
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
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted hover:bg-muted rounded-lg transition-colors"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Buscar...</span>
      <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground">
        <Command className="w-3 h-3" />K
      </kbd>
    </button>
  )
)
CommandPaletteTrigger.displayName = 'CommandPaletteTrigger'
