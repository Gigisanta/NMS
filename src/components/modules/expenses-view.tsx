'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  Banknote, 
  TrendingDown, 
  Users, 
  Truck, 
  MoreVertical,
  Trash2,
  Edit,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ExpenseForm } from './expenses/expense-form'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

// Types
export type ExpenseCategory = 'FIJO' | 'VARIABLE' | 'SUELDO' | 'PROVEEDOR' | 'OTROS'

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  month?: number
  year?: number
  userId?: string
  supplier?: string
  notes?: string
  user?: {
    name: string
  }
}

const CATEGORY_LABELS: Record<ExpenseCategory, { label: string, color: string, icon: any }> = {
  FIJO: { label: 'Fijo', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Banknote },
  VARIABLE: { label: 'Variable', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: TrendingDown },
  SUELDO: { label: 'Sueldo', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Users },
  PROVEEDOR: { label: 'Proveedor', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Truck },
  OTROS: { label: 'Otros', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Filter },
}

export function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth() + 1 + '')
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear() + '')
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      params.append('month', monthFilter)
      params.append('year', yearFilter)
      
      const response = await fetch(`/api/expenses?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setExpenses(result.data)
      } else {
        toast.error(result.error || 'Error al cargar gastos')
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Error de conexión al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, monthFilter, yearFilter])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleDelete = async () => {
    if (!expenseToDelete) return
    
    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('Gasto eliminado exitosamente')
        setIsDeleteOpen(false)
        setExpenseToDelete(null)
        fetchExpenses()
      } else {
        toast.error(result.error || 'Error al eliminar el gasto')
      }
    } catch (error) {
      toast.error('Error de conexión al eliminar el gasto')
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => 
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.supplier && e.supplier.toLowerCase().includes(search.toLowerCase())) ||
      (e.user?.name && e.user.name.toLowerCase().includes(search.toLowerCase()))
    )
  }, [expenses, search])

  const stats = useMemo(() => {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0)
    const sueldos = expenses.filter(e => e.category === 'SUELDO').reduce((acc, curr) => acc + curr.amount, 0)
    const proveedores = expenses.filter(e => e.category === 'PROVEEDOR').reduce((acc, curr) => acc + curr.amount, 0)
    const fijos = expenses.filter(e => e.category === 'FIJO').reduce((acc, curr) => acc + curr.amount, 0)
    
    return { total, sueldos, proveedores, fijos }
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Administración de Gastos</h1>
          <p className="text-slate-500">Gestiona los costos operativos, sueldos y proveedores.</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedExpense(undefined)
            setIsFormOpen(true)
          }}
          className="bg-[#005691] hover:bg-[#0078B0] text-white shadow-md rounded-xl h-11 px-6 gap-2"
        >
          <Plus className="w-5 h-5" />
          Registrar Gasto
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4 stagger-in">
        {[
          { title: 'Total Mes', value: stats.total, Icon: Banknote, accent: '#005691', trend: 'Egresos registrados' },
          { title: 'Sueldos', value: stats.sueldos, Icon: Users, accent: '#8b5cf6', trend: 'Personal y honorarios' },
          { title: 'Proveedores', value: stats.proveedores, Icon: Truck, accent: '#10b981', trend: 'Insumos y servicios' },
          { title: 'Fijos', value: stats.fijos, Icon: Filter, accent: '#00A8E8', trend: 'Alquiler e impuestos' },
        ].map((stat) => (
          <div key={stat.title} className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm card-lift">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{stat.title}</p>
                <p className="text-lg font-semibold text-slate-900 mt-1 tabular-nums truncate">{formatCurrency(stat.value)}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.trend}</p>
              </div>
              <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ background: `${stat.accent}18` }}>
                <stat.Icon className="w-4 h-4" style={{ color: stat.accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descripción, proveedor o empleado..."
                className="pl-10 h-11 border-slate-200 focus-visible:ring-[#00A8E8]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-11">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="FIJO">Fijos</SelectItem>
                  <SelectItem value="VARIABLE">Variables</SelectItem>
                  <SelectItem value="SUELDO">Sueldos</SelectItem>
                  <SelectItem value="PROVEEDOR">Proveedores</SelectItem>
                  <SelectItem value="OTROS">Otros</SelectItem>
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[140px] h-11">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i).toLocaleString('es-AR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[110px] h-11">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table/List */}
      <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold text-slate-800">Detalle de Egresos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00A8E8' }} />
              <p className="text-slate-500 text-sm">Cargando gastos...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <p className="text-slate-900 font-medium">No se encontraron gastos</p>
                <p className="text-slate-500 text-sm">Intenta cambiar los filtros o registra un nuevo gasto.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Destino</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredExpenses.map((expense) => {
                    const cat = CATEGORY_LABELS[expense.category]
                    const Icon = cat.icon
                    return (
                      <tr 
                        key={expense.id} 
                        className="hover:bg-[rgba(0,168,232,0.04)] transition-colors duration-150 group"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(expense.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(expense.date).toLocaleDateString('es-AR', { year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                          {expense.notes && <p className="text-xs text-slate-500 truncate max-w-[200px]">{expense.notes}</p>}
                          {/* Mobile: show category badge inline */}
                          <div className="sm:hidden mt-1">
                            <Badge className={`${cat.color} border shadow-none font-medium text-[10px] h-5`}>
                              <Icon className="w-2.5 h-2.5 mr-0.5" />
                              {cat.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <Badge className={`${cat.color} border shadow-none font-medium text-[11px] h-6`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {cat.label}
                          </Badge>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600">
                          {expense.category === 'SUELDO' ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-[10px] font-bold text-purple-600 border border-purple-100">
                                {expense.user?.name?.[0] || 'E'}
                              </div>
                              <span className="font-medium text-slate-700">{expense.user?.name || 'Empleado'}</span>
                            </div>
                          ) : expense.supplier ? (
                            <span className="font-medium text-slate-700">{expense.supplier}</span>
                          ) : (
                            <span className="text-slate-400 inline-block px-2 py-0.5 rounded-md bg-slate-50 text-[10px]">General</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(expense.amount)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#005691] transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedExpense(expense)
                                  setIsFormOpen(true)
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setExpenseToDelete(expense)
                                  setIsDeleteOpen(true)
                                }}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <ExpenseForm 
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false)
          fetchExpenses()
        }}
        expense={selectedExpense}
      />

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription className="py-2">
              ¿Estás seguro que deseas eliminar el gasto registrado como <strong>"{expenseToDelete?.description}"</strong> por un monto de <strong>{expenseToDelete && formatCurrency(expenseToDelete.amount)}</strong>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700">
              Eliminar Gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
