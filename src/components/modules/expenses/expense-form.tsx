'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { Expense, ExpenseCategory } from '../expenses-view'

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  expense?: Expense
}

export function ExpenseForm({ open, onClose, onSuccess, expense }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<{ id: string, name: string }[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'VARIABLE' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    userId: '',
    supplier: '',
    notes: '',
  })

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        date: new Date(expense.date).toISOString().split('T')[0],
        month: expense.month?.toString() || (new Date().getMonth() + 1).toString(),
        year: expense.year?.toString() || new Date().getFullYear().toString(),
        userId: expense.userId || '',
        supplier: expense.supplier || '',
        notes: expense.notes || '',
      })
    } else {
      setFormData({
        description: '',
        amount: '',
        category: 'VARIABLE',
        date: new Date().toISOString().split('T')[0],
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString(),
        userId: '',
        supplier: '',
        notes: '',
      })
    }
  }, [expense, open])

  useEffect(() => {
    if (open) {
      fetchEmployees()
    }
  }, [open])

  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const response = await fetch('/api/employees?active=true')
      const result = await response.json()
      if (result.success) {
        setEmployees(result.data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = expense ? `/api/expenses/${expense.id}` : '/api/expenses'
      const method = expense ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(expense ? 'Gasto actualizado' : 'Gasto registrado')
        onSuccess()
      } else {
        toast.error(result.error || 'Error al guardar el gasto')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
        <div className="bg-[#005691] p-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-white/10 rounded-full blur-2xl" />
          <DialogTitle className="text-xl font-bold relative z-10">
            {expense ? 'Editar Registro de Gasto' : 'Registrar Nuevo Gasto'}
          </DialogTitle>
          <p className="text-white/70 text-sm mt-1 relative z-10">
            Ingresa los detalles del egreso para el seguimiento contable.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 font-semibold">Descripción *</Label>
            <Input 
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Pago de alquiler marzo"
              required
              className="h-11 border-slate-200 focus-visible:ring-[#00A8E8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-700 font-semibold">Monto ($) *</Label>
              <Input 
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className="h-11 border-slate-200 focus-visible:ring-[#00A8E8]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-700 font-semibold">Categoría *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v: ExpenseCategory) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIJO">Fijo</SelectItem>
                  <SelectItem value="VARIABLE">Variable</SelectItem>
                  <SelectItem value="SUELDO">Sueldo</SelectItem>
                  <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
                  <SelectItem value="OTROS">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-700 font-semibold">Fecha</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input 
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-11 pl-10 border-slate-200 focus-visible:ring-[#00A8E8]"
                />
              </div>
            </div>
            {formData.category === 'SUELDO' || formData.category === 'FIJO' ? (
              <div className="space-y-2">
                <Label htmlFor="month" className="text-slate-700 font-semibold">Periodo (Mes)</Label>
                <Select 
                  value={formData.month} 
                  onValueChange={(v) => setFormData({ ...formData, month: v })}
                >
                  <SelectTrigger className="h-11 border-slate-200">
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
              </div>
            ) : null}
          </div>

          {formData.category === 'SUELDO' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="employee" className="text-slate-700 font-semibold">Empleado *</Label>
              <Select 
                value={formData.userId} 
                onValueChange={(v) => setFormData({ ...formData, userId: v })}
                required
              >
                <SelectTrigger className="h-11 border-slate-200">
                  {loadingEmployees ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00A8E8]" />
                      <span>Cargando...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Seleccionar empleado" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.category === 'PROVEEDOR' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="supplier" className="text-slate-700 font-semibold">Proveedor</Label>
              <Input 
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Ej: Distribuidora de Cloro"
                className="h-11 border-slate-200 focus-visible:ring-[#00A8E8]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-700 font-semibold">Notas (Opcional)</Label>
            <Textarea 
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalles adicionales del gasto..."
              className="resize-none border-slate-200 focus-visible:ring-[#00A8E8]"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="h-11 rounded-xl text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 rounded-xl bg-[#005691] hover:bg-[#0078B0] text-white font-semibold flex-1 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                expense ? 'Actualizar Gasto' : 'Registrar Gasto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
