'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryClient } from '@/lib/queryClient'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Loader2,
  Users,
  Pencil,
  Trash2,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Group {
  id: string
  name: string
  color: string
  description?: string | null
  schedule?: string | null
  clientCount?: number
}

interface GroupManagerProps {
  groups: Group[]
  onGroupsChange: () => void
  trigger?: React.ReactNode
}

const predefinedColors = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

export function GroupManager({ groups, onGroupsChange, trigger }: GroupManagerProps) {
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newGroup, setNewGroup] = useState({
    name: '',
    color: predefinedColors[0],
    schedule: '',
    description: '',
  })
  const [editGroup, setEditGroup] = useState<Group | null>(null)

  const handleCreate = async () => {
    if (!newGroup.name.trim()) return
    setSaving(true)
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroup.name.trim(),
          color: newGroup.color,
          schedule: newGroup.schedule.trim() || null,
          description: newGroup.description.trim() || null,
        }),
      })
      const result = await response.json()
      if (result.success) {
        // Directly update cache with fresh data from API - no refetch needed
        queryClient.setQueryData<Group[]>(['groups'], (old) => {
          if (!old) return [result.data]
          return [...old, result.data]
        })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        onGroupsChange()
        setShowCreate(false)
        setNewGroup({ name: '', color: predefinedColors[0], schedule: '', description: '' })
        setError(null)
        setSaving(false)
        return
      } else {
        setError(result.error || 'Error al crear el grupo')
      }
    } catch (err) {
      console.error('Error creating group:', err)
      setError('Error al crear el grupo. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editGroup || !editGroup.name.trim()) return
    setSaving(true)
    try {
      const response = await fetch(`/api/groups/${editGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editGroup.name.trim(),
          color: editGroup.color,
          schedule: editGroup.schedule?.trim() || null,
          description: editGroup.description?.trim() || null,
        }),
      })
      const result = await response.json()
      if (result.success) {
        // Directly update cache with fresh data from API - no refetch needed
        queryClient.setQueryData<Group[]>(['groups'], (old) => {
          if (!old) return [result.data]
          return old.map(g => g.id === result.data.id ? { ...g, ...result.data } : g)
        })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        onGroupsChange()
        setEditingId(null)
        setEditGroup(null)
        setError(null)
      } else {
        setError(result.error || 'Error al actualizar el grupo')
      }
    } catch (err) {
      console.error('Error updating group:', err)
      setError('Error al actualizar el grupo. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        // Directly update cache by removing the deleted group
        queryClient.setQueryData<Group[]>(['groups'], (old) => {
          if (!old) return []
          return old.filter(g => g.id !== id)
        })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        onGroupsChange()
        setConfirmDeleteId(null)
        setError(null)
      } else {
        setError(result.error || 'Error al eliminar el grupo')
        setConfirmDeleteId(null)
      }
    } catch (err) {
      console.error('Error deleting group:', err)
      setError('Error al eliminar el grupo. Intenta de nuevo.')
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (confirmDeleteId !== null) {
      handleDelete(confirmDeleteId)
    }
  }

  const cancelCreate = () => {
    setShowCreate(false)
    setNewGroup({ name: '', color: predefinedColors[0], schedule: '', description: '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditGroup(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Gestionar Grupos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Gestionar Grupos</DialogTitle>
          <DialogDescription>
            Crea, edita o elimina grupos de clientes
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="border rounded-lg p-3 bg-white">
                {editingId === group.id ? (
                  <GroupEditForm
                    group={editGroup!}
                    onSave={handleUpdate}
                    onCancel={cancelEdit}
                    saving={saving}
                  />
                ) : (
                  <GroupRow
                    group={group}
                    onEdit={() => { setEditingId(group.id); setEditGroup(group) }}
                    onDelete={() => setConfirmDeleteId(group.id)}
                    deletingId={deletingId}
                  />
                )}
              </div>
            ))}

            {showCreate ? (
              <GroupCreateForm
                value={newGroup}
                onChange={setNewGroup}
                onSave={handleCreate}
                onCancel={cancelCreate}
                saving={saving}
              />
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter>
          {!showCreate && editingId === null ? (
            <Button
              variant="outline"
              onClick={() => setShowCreate(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Grupo
            </Button>
          ) : null}
          {error ? (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded mt-2 w-full">
              {error}
            </div>
          ) : null}
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El grupo será marcado como inactivo y todos los clientes serán desasignados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupRow({
  group,
  onEdit,
  onDelete,
  deletingId,
}: {
  group: Group
  onEdit: () => void
  onDelete: () => void
  deletingId: string | null
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: group.color + '20' }}
        >
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: group.color }} />
        </div>
        <div>
          <div className="font-medium text-sm" style={{ color: group.color }}>
            {group.name}
          </div>
          {group.schedule ? (
            <div className="text-xs text-slate-500">{group.schedule}</div>
          ) : null}
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {group.clientCount || 0} clientes
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onEdit}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          onClick={onDelete}
          disabled={deletingId === group.id}
        >
          {deletingId === group.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function GroupEditForm({
  group,
  onSave,
  onCancel,
  saving,
}: {
  group: Group
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const [localGroup, setLocalGroup] = useState(group)

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-500">Nombre</Label>
        <Input
          value={localGroup.name}
          onChange={(e) => setLocalGroup({ ...localGroup, name: e.target.value })}
          className="h-8"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Horario</Label>
        <Input
          value={localGroup.schedule || ''}
          onChange={(e) => setLocalGroup({ ...localGroup, schedule: e.target.value })}
          placeholder="Ej: Lun-Mié 16:00"
          className="h-8"
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
                localGroup.color === color ? 'border-slate-800 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
              onClick={() => setLocalGroup({ ...localGroup, color })}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}

function GroupCreateForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  value: { name: string; color: string; schedule: string; description: string }
  onChange: (v: typeof value) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="border rounded-lg p-3 bg-slate-50 space-y-3">
      <div>
        <Label className="text-xs text-slate-500">Nombre del grupo</Label>
        <Input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Ej: Grupo A"
          className="h-8"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Horario</Label>
        <Input
          value={value.schedule}
          onChange={(e) => onChange({ ...value, schedule: e.target.value })}
          placeholder="Ej: Lun-Mié 16:00"
          className="h-8"
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
                value.color === color ? 'border-slate-800 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ ...value, color })}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!value.name.trim() || value.name.trim().length < 2 || saving}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Crear'}
        </Button>
      </div>
    </div>
  )
}

export default GroupManager
