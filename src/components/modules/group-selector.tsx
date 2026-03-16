'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  Check, 
  X, 
  Loader2,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GroupBadge } from './group-badge'

// Predefined colors for groups
const predefinedColors = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

interface Group {
  id: string
  name: string
  color: string
  description?: string | null
  schedule?: string | null
  clientCount?: number
}

interface GroupSelectorProps {
  value: string | null
  onChange: (grupoId: string | null) => void
  groups: Group[]
  onGroupsChange?: () => void
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function GroupSelector({
  value,
  onChange,
  groups,
  onGroupsChange,
  placeholder = 'Seleccionar grupo',
  size = 'md',
  disabled = false,
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState(predefinedColors[0])
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedGroup = groups.find(g => g.id === value) || null

  useEffect(() => {
    if (showCreate && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showCreate])

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          color: newGroupColor,
        }),
      })

      const result = await response.json()
      if (result.success) {
        onGroupsChange?.()
        onChange(result.data.id)
        setShowCreate(false)
        setNewGroupName('')
      }
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-full transition-all',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <GroupBadge 
            group={selectedGroup} 
            size={size} 
            interactive={!disabled}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Seleccionar Grupo</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-cyan-600 hover:text-cyan-700"
              onClick={() => setShowCreate(!showCreate)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Nuevo
            </Button>
          </div>
        </div>

        {showCreate ? (
          <div className="p-3 border-b bg-slate-50 space-y-3">
            <div>
              <Label className="text-xs text-slate-500">Nombre del grupo</Label>
              <Input
                ref={inputRef}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ej: Grupo C"
                className="h-8 mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGroup()
                  if (e.key === 'Escape') setShowCreate(false)
                }}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Color</Label>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                      newGroupColor === color ? 'border-slate-800 scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGroupColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-xs bg-gradient-to-r from-cyan-500 to-sky-600"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || creating}
              >
                {creating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Crear'
                )}
              </Button>
            </div>
          </div>
        ) : null}

        <ScrollArea className="max-h-64">
          <div className="p-1">
            {/* Option to clear selection */}
            <button
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                'hover:bg-slate-100',
                !selectedGroup && 'bg-cyan-50 text-cyan-700'
              )}
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                <X className="w-3 h-3 text-slate-500" />
              </div>
              <span>Sin grupo</span>
              {!selectedGroup && <Check className="w-4 h-4 ml-auto" />}
            </button>

            {/* Group options */}
            {groups.map((group) => (
              <button
                key={group.id}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  'hover:bg-slate-100',
                  selectedGroup?.id === group.id && 'bg-cyan-50'
                )}
                onClick={() => {
                  onChange(group.id)
                  setOpen(false)
                }}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${group.color}20` }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium" style={{ color: group.color }}>
                    {group.name}
                  </div>
                  {group.schedule && (
                    <div className="text-xs text-slate-500">{group.schedule}</div>
                  )}
                </div>
                {group.clientCount !== undefined && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group.clientCount}
                  </span>
                )}
                {selectedGroup?.id === group.id && (
                  <Check className="w-4 h-4 text-cyan-600" />
                )}
              </button>
            ))}

            {groups.length === 0 && !showCreate && (
              <div className="px-3 py-6 text-center text-sm text-slate-500">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-slate-400" />
                </div>
                <p>No hay grupos creados</p>
                <p className="text-xs">Haz clic en "Nuevo" para crear uno</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
