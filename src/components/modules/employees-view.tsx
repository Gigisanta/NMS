'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Mail,
  Phone,
  Search,
  Filter,
  Loader2,
  X,
  DollarSign,
  UserCheck,
  UserX,
  Calendar,
  Briefcase,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-optimized'
import { toast } from 'sonner'

// Types
interface Employee {
  id: string
  name: string | null
  email: string
  role: string
  employeeRole: string | null
  hourlyRate: number | null
  phone: string | null
  active: boolean
  image: string | null
  createdAt: string
  _count?: {
    timeEntries: number
  }
}

interface EmployeeFormData {
  name: string
  email: string
  password: string
  employeeRole: string
  hourlyRate: string
  phone: string
}

const initialFormData: EmployeeFormData = {
  name: '',
  email: '',
  password: '',
  employeeRole: 'PROFESOR',
  hourlyRate: '',
  phone: '',
}

// Default role config for known roles
const roleConfig: Record<string, { label: string; color: string; icon: typeof Briefcase }> = {
  ADMINISTRATIVO: { label: 'Administrativo', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Briefcase },
  PROFESOR: { label: 'Profesor', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Users },
  LIMPIEZA: { label: 'Limpieza', color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck },
}

// Employee Card Component
const EmployeeCard = memo(function EmployeeCard({ 
  employee,
  onEdit,
  onDelete,
  onToggleActive,
}: { 
  employee: Employee
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onToggleActive: (employee: Employee) => void
}) {
  const roleInfo = employee.employeeRole ? (roleConfig[employee.employeeRole] || { label: employee.employeeRole, color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Briefcase }) : null
  const RoleIcon = roleInfo?.icon || Users
  
  const initials = useMemo(() => {
    if (employee.name) {
      const parts = employee.name.split(' ')
      return parts.length >= 2 
        ? `${parts[0][0]}${parts[1][0]}` 
        : parts[0].substring(0, 2).toUpperCase()
    }
    return '??'
  }, [employee.name])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border-slate-100 shadow-sm transition-shadow duration-200 hover:shadow-md ${
        !employee.active ? 'opacity-60' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                <AvatarImage src={employee.image || undefined} />
                <AvatarFallback className="text-white font-medium" style={{ background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)' }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-slate-900">
                  {employee.name || 'Sin nombre'}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {employee.email}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(employee)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(employee)}>
                  {employee.active ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(employee)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            {/* Role Badge */}
            <div className="flex items-center gap-2">
              {roleInfo ? (
                <Badge className={`${roleInfo.color} border text-xs`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {roleInfo.label}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Sin rol asignado
                </Badge>
              )}
              {!employee.active && (
                <Badge variant="destructive" className="text-xs">
                  Inactivo
                </Badge>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {employee.hourlyRate && (
                <div className="flex items-center gap-1 text-slate-600">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(employee.hourlyRate)}/hora
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Phone className="w-3 h-3" />
                  {employee.phone}
                </div>
              )}
              <div className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3" />
                {employee._count?.timeEntries || 0} fichajes
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3 h-3" />
                {new Date(employee.createdAt).toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

// Employee Form Dialog
const EmployeeFormDialog = memo(function EmployeeFormDialog({
  open,
  onClose,
  onSubmit,
  employee,
  loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: EmployeeFormData) => void
  employee: Employee | null
  loading: boolean
}) {
  // Compute initial form data based on employee
  const getInitialFormData = useCallback((emp: Employee | null): EmployeeFormData => {
    if (emp) {
      return {
        name: emp.name || '',
        email: emp.email,
        password: '',
        employeeRole: emp.employeeRole || 'PROFESOR',
        hourlyRate: emp.hourlyRate?.toString() || '',
        phone: emp.phone || '',
      }
    }
    return initialFormData
  }, [])

  const [formData, setFormData] = useState<EmployeeFormData>(() => getInitialFormData(employee))

  // Handle dialog close
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }, [onClose])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }, [formData, onSubmit])

  // Use key to reset form when employee changes
  const formKey = useMemo(() => employee?.id || 'new', [employee?.id])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </DialogTitle>
          <DialogDescription>
            {employee 
              ? 'Actualiza la información del empleado'
              : 'Completa los datos para crear un nuevo empleado'}
          </DialogDescription>
        </DialogHeader>
        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                Contraseña {employee ? '(dejar vacío para no cambiar)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required={!employee}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="employeeRole">Rol de trabajo *</Label>
              <Select value={formData.employeeRole} onValueChange={(value) => setFormData({ ...formData, employeeRole: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROFESOR">Profesor</SelectItem>
                  <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                  <SelectItem value="LIMPIEZA">Limpieza</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Tarifa por hora ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="1500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+54 9 11..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="text-white"
              style={{ background: '#005691' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                employee ? 'Guardar cambios' : 'Crear empleado'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

// Delete Confirmation Dialog
const DeleteDialog = memo(function DeleteDialog({
  open,
  onClose,
  onConfirm,
  employee,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  employee: Employee | null
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Eliminar Empleado</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar a <strong>{employee?.name}</strong>?
            Esta acción desactivará el empleado y no podrá iniciar sesión.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

// Main Component
export function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  
  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (!showActiveOnly) params.set('active', 'false')
      
      const response = await fetch(`/api/employees?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setEmployees(result.data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }, [showActiveOnly])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // All unique roles for filtering
  const uniqueRoles = useMemo(() => {
    const roles = new Set(employees.map(e => e.employeeRole).filter(Boolean))
    return Array.from(roles) as string[]
  }, [employees])

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = !debouncedSearch || 
        emp.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        emp.email.toLowerCase().includes(debouncedSearch.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || emp.employeeRole === roleFilter
      
      return matchesSearch && matchesRole
    })
  }, [employees, debouncedSearch, roleFilter])

  // Handlers
  const handleCreate = useCallback(async (data: EmployeeFormData) => {
    setSaving(true)
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Empleado creado exitosamente')
        setFormOpen(false)
        fetchEmployees()
      } else {
        toast.error(result.error || 'Error al crear empleado')
      }
    } catch (error) {
      toast.error('Error al crear empleado')
    } finally {
      setSaving(false)
    }
  }, [fetchEmployees])

  const handleUpdate = useCallback(async (data: EmployeeFormData) => {
    if (!selectedEmployee) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Empleado actualizado exitosamente')
        setFormOpen(false)
        setSelectedEmployee(null)
        fetchEmployees()
      } else {
        toast.error(result.error || 'Error al actualizar empleado')
      }
    } catch (error) {
      toast.error('Error al actualizar empleado')
    } finally {
      setSaving(false)
    }
  }, [selectedEmployee, fetchEmployees])

  const handleDelete = useCallback(async () => {
    if (!selectedEmployee) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Empleado desactivado exitosamente')
        setDeleteOpen(false)
        setSelectedEmployee(null)
        fetchEmployees()
      } else {
        toast.error(result.error || 'Error al eliminar empleado')
      }
    } catch (error) {
      toast.error('Error al eliminar empleado')
    } finally {
      setSaving(false)
    }
  }, [selectedEmployee, fetchEmployees])

  const handleToggleActive = useCallback(async (employee: Employee) => {
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !employee.active }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Empleado ${!employee.active ? 'activado' : 'desactivado'} exitosamente`)
        fetchEmployees()
      } else {
        toast.error(result.error || 'Error al actualizar estado')
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }, [fetchEmployees])

  const openEditDialog = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setFormOpen(true)
  }, [])

  const openDeleteDialog = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setDeleteOpen(true)
  }, [])

  const handleFormSubmit = useCallback((data: EmployeeFormData) => {
    if (selectedEmployee) {
      handleUpdate(data)
    } else {
      handleCreate(data)
    }
  }, [selectedEmployee, handleCreate, handleUpdate])

  // Stats
  const stats = useMemo(() => ({
    total: employees.filter(e => e.active).length,
    profesores: employees.filter(e => e.active && e.employeeRole === 'PROFESOR').length,
    administrativos: employees.filter(e => e.active && e.employeeRole === 'ADMINISTRATIVO').length,
    limpieza: employees.filter(e => e.active && e.employeeRole === 'LIMPIEZA').length,
  }), [employees])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00A8E8' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Empleados</h1>
          <p className="text-slate-500">
            Gestiona el equipo de trabajo y sus horarios
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedEmployee(null)
            setFormOpen(true)
          }}
          className="gap-2"
          style={{ background: '#005691' }}
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total activos', value: stats.total, Icon: Users, accent: '#005691' },
          { title: 'Profesores', value: stats.profesores, Icon: Users, accent: '#8b5cf6' },
          { title: 'Administrativos', value: stats.administrativos, Icon: Briefcase, accent: '#00A8E8' },
          { title: 'Limpieza', value: stats.limpieza, Icon: UserCheck, accent: '#10b981' },
        ].map((stat) => (
          <div key={stat.title} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{stat.value}</p>
              </div>
              <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ background: `${stat.accent}18` }}>
                <stat.Icon className="w-4 h-4" style={{ color: stat.accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {roleConfig[role]?.label || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showActiveOnly ? 'default' : 'outline'}
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                style={showActiveOnly ? { background: '#005691', color: 'white' } : {}}
              >
                {showActiveOnly ? 'Activos' : 'Todos'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-14 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Sin empleados</p>
            <p className="text-xs text-slate-400 mt-1">
              {search || roleFilter !== 'all'
                ? 'No se encontraron resultados con esos filtros'
                : 'Agrega el primer empleado para comenzar'}
            </p>
          </div>
        </div>
      ) : (
        <motion.div 
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onToggleActive={handleToggleActive}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dialogs */}
      <EmployeeFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedEmployee(null)
        }}
        onSubmit={handleFormSubmit}
        employee={selectedEmployee}
        loading={saving}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setSelectedEmployee(null)
        }}
        onConfirm={handleDelete}
        employee={selectedEmployee}
        loading={saving}
      />
    </div>
  )
}

export default EmployeesView
