'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Receipt, Send, CheckCircle2, AlertTriangle, ExternalLink, Clock } from 'lucide-react'
import { formatFullName, formatCurrency, getCurrentMonth, getCurrentYear, formatMonthYear } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Subscription {
  id: string
  month: number
  year: number
  amount: number | null
  status: string
  paymentMethod: string | null
  isBilled: boolean
  client: {
    nombre: string
    apellido: string
    dni: string | null
  }
}

export function BillingView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedYear, setSelectedYear] = useState(getCurrentYear())

  const fetchBillableItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('month', selectedMonth.toString())
      params.set('year', selectedYear.toString())
      params.set('status', 'AL_DIA') // Only bill those who paid

      const response = await fetch(`/api/subscriptions?${params}`)
      const result = await response.json()
      if (result.success) {
        setSubscriptions(result.data)
      }
    } catch (error) {
      console.error('Error fetching billable items:', error)
      toast.error('Error al cargar items facturables')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchBillableItems()
  }, [fetchBillableItems])

  const toggleSelectAll = () => {
    if (selectedIds.size === subscriptions.filter(s => !s.isBilled).length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(subscriptions.filter(s => !s.isBilled).map(s => s.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleProcessBilling = async () => {
    if (selectedIds.size === 0) return

    setProcessing(true)
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionIds: Array.from(selectedIds) }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Se han procesado ${selectedIds.size} facturas exitosamente a través de Mercado Pago y ARCA.`)
        setSelectedIds(new Set())
        fetchBillableItems()
      } else {
        toast.error(result.error || 'Error al procesar facturación')
      }
    } catch (error) {
      toast.error('Error de conexión con el servicio de facturación')
    } finally {
      setProcessing(false)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [selectedYear - 1, selectedYear, selectedYear + 1]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturación (ARCA & Mercado Pago)</h1>
          <p className="text-slate-500">
            Gestiona la facturación electrónica y cobros automáticos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
          >
            {months.map(m => (
              <option key={m} value={m}>
                {formatMonthYear(m, selectedYear).split(' ')[0]}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 text-white">Estado de Conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">ARCA (AFIP)</p>
                <div className="flex items-center gap-1.5 text-xs text-blue-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Conectado - Modo Producción
                </div>
              </div>
              <Receipt className="w-8 h-8 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sky-400 to-blue-500 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 text-white">Mercado Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">API Gateway</p>
                <div className="flex items-center gap-1.5 text-xs text-sky-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Activo para conciliación
                </div>
              </div>
              <ExternalLink className="w-8 h-8 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pendientes de Facturar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {subscriptions.filter(s => !s.isBilled).length}
                </p>
                <p className="text-xs text-slate-500">Items en este período</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Items Facturables</CardTitle>
              <CardDescription>Selecciona los items que deseas procesar con ARCA</CardDescription>
            </div>
            <Button
              disabled={selectedIds.size === 0 || processing}
              onClick={handleProcessBilling}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Facturar Seleccionados ({selectedIds.size})
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-slate-500">
              <Receipt className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg font-medium">No hay items para facturar</p>
              <p className="text-sm">Solo se muestran clientes con pago "Al Día"</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size > 0 && selectedIds.size === subscriptions.filter(s => !s.isBilled).length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado Fact.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {subscriptions.map((sub, index) => (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`hover:bg-slate-50/50 transition-colors ${sub.isBilled ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                      <TableCell>
                        {!sub.isBilled && (
                          <Checkbox
                            checked={selectedIds.has(sub.id)}
                            onCheckedChange={() => toggleSelect(sub.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatFullName(sub.client.nombre, sub.client.apellido)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{sub.client.dni || '---'}</TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {formatCurrency(sub.amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wider">
                          {sub.paymentMethod || 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.isBilled ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 shadow-none">
                            <CheckCircle2 className="w-3 h-3" />
                            Facturado (ARCA)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 gap-1.5">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
