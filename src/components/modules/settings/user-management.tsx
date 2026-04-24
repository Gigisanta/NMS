'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Users, Plus, Edit2, Trash2, UserCheck, UserX, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  email: string
  role: 'EMPLEADORA' | 'EMPLEADO'
  employeeRole: string | null
  phone: string | null
  active: boolean
  createdAt: string
}

export function UserManagement() {
  const { data: session } = useSession()
  const isEmpleadora = session?.user?.role === 'EMPLEADORA'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLEADO',
    employeeRole: 'PROFESOR',
    phone: '',
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/employees')
      const result = await response.json()
      if (result.success) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers()
  }, [fetchUsers])

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLEADO',
      employeeRole: 'PROFESOR',
      phone: '',
    })
    setEditingUser(null)
  }, [])

  const handleOpenDialog = useCallback((user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        role: user.role,
        employeeRole: user.employeeRole || 'PROFESOR',
        phone: user.phone || '',
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }, [resetForm])

  const handleSave = useCallback(async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nombre y email son requeridos')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('La contraseña es requerida para nuevos usuarios')
      return
    }

    setSaving(true)
    try {
      if (editingUser) {
        // Update existing user
        const updateData: Record<string, unknown> = {
          name: formData.name,
          employeeRole: formData.employeeRole,
          phone: formData.phone || null,
        }
        if (formData.password) {
          updateData.password = formData.password
        }

        const response = await fetch(`/api/employees/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })

        const result = await response.json()
        if (result.success) {
          toast.success('Usuario actualizado')
          fetchUsers()
          setDialogOpen(false)
          resetForm()
        } else {
          toast.error(result.error || 'Error al actualizar')
        }
      } else {
        // Create new user
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            employeeRole: formData.employeeRole,
          }),
        })

        const result = await response.json()
        if (result.success) {
          toast.success('Usuario creado')
          fetchUsers()
          setDialogOpen(false)
          resetForm()
        } else {
          toast.error(result.error || 'Error al crear usuario')
        }
      }
    } catch (error) {
      toast.error('Error al guardar usuario')
    } finally {
      setSaving(false)
    }
  }, [formData, editingUser, fetchUsers, resetForm])

  const handleToggleActive = useCallback(async (user: User) => {
    try {
      const response = await fetch(`/api/employees/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(user.active ? 'Usuario desactivado' : 'Usuario activado')
        fetchUsers()
      }
    } catch (error) {
      toast.error('Error al actualizar usuario')
    }
  }, [fetchUsers])

  const handleDelete = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/employees/${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Usuario eliminado')
        fetchUsers()
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar usuario')
    }
  }, [fetchUsers])

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getEmployeeRoleLabel = (role: string | null) => {
    if (!role) return 'Sin rol'
    const knownRoles: Record<string, string> = {
      'ADMINISTRATIVO': 'Administrativo',
      'PROFESOR': 'Profesor',
      'LIMPIEZA': 'Limpieza'
    }
    return knownRoles[role] || role
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && user.active) ||
      (filter === 'inactive' && !user.active)
    return matchesSearch && matchesFilter
  })

  if (!isEmpleadora) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="py-8 text-center">
          <p className="text-slate-500">No tienes permisos para ver esta sección</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Gestión de Usuarios</CardTitle>
            <CardDescription>Administra los usuarios del sistema</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Modifica los datos del usuario' : 'Crea un nuevo usuario para el sistema'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre y apellido"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    disabled={!!editingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                      disabled={!!editingUser}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLEADO">Empleado</SelectItem>
                        <SelectItem value="EMPLEADORA">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.role === 'EMPLEADO' && (
                    <div className="space-y-2">
                      <Label>Tipo de Empleado</Label>
                      <Input
                        value={formData.employeeRole}
                        onChange={(e) => setFormData(prev => ({ ...prev, employeeRole: e.target.value }))}
                        placeholder="Ej: Profesor, Administrativo..."
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+54 351 123 4567"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuarios..."
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <ScrollArea className="max-h-96">
            <div className="space-y-2 pr-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    user.active ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-300 opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={cn(
                        user.role === 'EMPLEADORA' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-slate-100 text-slate-700'
                      )}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name || 'Sin nombre'}</span>
                        {user.role === 'EMPLEADORA' && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">Admin</Badge>
                        )}
                        {user.employeeRole && user.role === 'EMPLEADO' && (
                          <Badge className="bg-slate-100 text-slate-600 text-xs">
                            {getEmployeeRoleLabel(user.employeeRole)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-slate-500">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(user)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(user)}
                      className={cn('h-8 w-8', user.active ? 'text-amber-600' : 'text-emerald-600')}
                    >
                      {user.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                    {user.id !== session?.user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-slate-500 py-8">No se encontraron usuarios</p>
        )}
      </CardContent>
    </Card>
  )
}
