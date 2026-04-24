'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormField, FormLabel, FormControl, FormMessage, FormItem } from '@/components/ui/form'
import { ReceiptUploader } from '@/components/ui/receipt-uploader'
import { Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { Expense, ExpenseCategory } from '../expenses-view'

const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.string().min(1, 'El monto es requerido').refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    'Debe ser un número positivo'
  ),
  category: z.enum(['VARIABLE', 'FIJO', 'SUELDO', 'PROVEEDOR', 'OTROS']),
  date: z.string().min(1, 'La fecha es requerida'),
  month: z.string().optional(),
  year: z.string().optional(),
  userId: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseInput = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  expense?: Expense
}

export function ExpenseForm({ open, onClose, onSuccess, expense }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const [currentReceiptId, setCurrentReceiptId] = useState<string | null>(null)
  const [currentReceiptFileName, setCurrentReceiptFileName] = useState<string | null>(null)
  const [currentReceiptStatus, setCurrentReceiptStatus] = useState<string | null>(null)

  const [employeeMode, setEmployeeMode] = useState<'select' | 'custom'>('select')

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: '',
      category: 'VARIABLE',
      date: new Date().toISOString().split('T')[0],
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      userId: '',
      supplier: '',
      notes: '',
    },
  })

  const { setValue, reset, control } = form
  const formCategory = useWatch({ control, name: 'category' })
  const formUserId = useWatch({ control, name: 'userId' })
  const formSupplier = useWatch({ control, name: 'supplier' })

  const fetchEmployees = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (expense) {
      const isCustomEmployee = expense.userId === null && expense.supplier
      reset({
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmployeeMode(isCustomEmployee ? 'custom' : 'select')
      setCurrentReceiptId(expense.receiptId || null)
      setCurrentReceiptFileName(expense.receipt?.fileName || null)
      setCurrentReceiptStatus(expense.receiptStatus || null)
    } else {
      reset({
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
      setEmployeeMode('select')
      setCurrentReceiptId(null)
      setCurrentReceiptFileName(null)
      setCurrentReceiptStatus(null)
    }
  }, [expense, open, reset])

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmployees()
    }
  }, [open, fetchEmployees])

  const handleReceiptUpload = async (file: File): Promise<{ id: string } | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'RECEIPT')
    formData.append('clientId', 'SYSTEM')
    formData.append('description', expense ? `Comprobante gasto ${expense.id}` : 'Comprobante de gasto')

    const res = await fetch('/api/invoices', {
      method: 'POST',
      body: formData,
    })
    const result = await res.json()
    if (result.success) {
      setCurrentReceiptId(result.data.id)
      setCurrentReceiptFileName(result.data.fileName)
      setCurrentReceiptStatus('PENDING')
      return { id: result.data.id }
    }
    return null
  }

  const handleReceiptRemove = async () => {
    if (!currentReceiptId) return
    await fetch(`/api/invoices/${currentReceiptId}`, { method: 'DELETE' })
    setCurrentReceiptId(null)
    setCurrentReceiptFileName(null)
    setCurrentReceiptStatus(null)
  }

  const onSubmit = async (data: ExpenseInput) => {
    setLoading(true)

    try {
      const url = expense ? `/api/expenses/${expense.id}` : '/api/expenses'
      const method = expense ? 'PUT' : 'POST'

      const payload = {
        ...data,
        receiptId: currentReceiptId,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleEmployeeModeChange = (mode: 'select' | 'custom') => {
    setEmployeeMode(mode)
    if (mode === 'select') {
      setValue('supplier', '')
      setValue('userId', '')
    } else {
      setValue('userId', '')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
        <div className="bg-primary p-6 text-primary-foreground relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-white/10 rounded-full blur-2xl" />
          <DialogTitle className="text-xl font-semibold relative z-10">
            {expense ? 'Editar Registro de Gasto' : 'Registrar Nuevo Gasto'}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/70 text-sm mt-1 relative z-10">
            Ingresa los detalles del egreso para el seguimiento contable.
          </DialogDescription>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4 bg-white">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Descripción *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Pago de alquiler marzo"
                      required
                      className="h-11 border-slate-200 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Monto ($) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                        className="h-11 border-slate-200 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Categoría *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Fecha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          {...field}
                          type="date"
                          className="h-11 pl-10 border-slate-200 focus-visible:ring-primary"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formCategory === 'SUELDO' || formCategory === 'FIJO' ? (
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">Periodo (Mes)</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            {formCategory === 'SUELDO' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={employeeMode === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleEmployeeModeChange('select')}
                    className={employeeMode === 'select' ? 'bg-primary hover:bg-primary/90' : ''}
                  >
                    Seleccionar
                  </Button>
                  <Button
                    type="button"
                    variant={employeeMode === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleEmployeeModeChange('custom')}
                    className={employeeMode === 'custom' ? 'bg-primary hover:bg-primary/90' : ''}
                  >
                    Otro nombre
                  </Button>
                </div>

                {employeeMode === 'select' ? (
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Empleado existente *</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            required={employeeMode === 'select'}
                          >
                            <SelectTrigger className="h-11 border-slate-200 mt-1">
                              {loadingEmployees ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Nombre del empleado *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: María González"
                            required={employeeMode === 'custom'}
                            className="h-11 border-slate-200 focus-visible:ring-primary mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-slate-500 mt-1">
                          Ingresa el nombre del empleado que no está en la lista
                        </p>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {formCategory === 'PROVEEDOR' && (
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Proveedor</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Distribuidora de Cloro"
                        className="h-11 border-slate-200 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detalles adicionales del gasto..."
                      className="resize-none border-slate-200 focus-visible:ring-primary"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <FormLabel className="text-slate-700 font-semibold mb-2 block">Comprobante</FormLabel>
              <ReceiptUploader
                onUpload={handleReceiptUpload}
                onRemove={currentReceiptId ? handleReceiptRemove : undefined}
                currentReceiptId={currentReceiptId}
                currentFileName={currentReceiptFileName}
                currentStatus={currentReceiptStatus}
                disabled={loading}
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
                className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex-1 transition-all duration-300 shadow-md hover:shadow-lg"
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
        </Form>
      </DialogContent>
    </Dialog>
  )
}
