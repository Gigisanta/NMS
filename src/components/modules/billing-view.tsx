'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Receipt, Send, CheckCircle2, AlertTriangle, ExternalLink, Clock } from 'lucide-react'
import { formatFullName, formatCurrency, getCurrentMonth, getCurrentYear, formatMonthYear } from '@/lib/utils'
import { useAppStore } from '@/store'
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

  const invalidateDashboard = useAppStore((state) => state.invalidateDashboard)

  const fetchBillableItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('month', selectedMonth.toString())
      params.set('year', selectedYear.toString())
      // Removed invalid 'AL_DIA' status filter - subscription status is PENDIENTE by default
      // Client payment status is calculated dynamically from invoices

      const response = await fetch(`/api/subscriptions?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
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
        invalidateDashboard()
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
          <h1 className="text-xl font-semibold text-slate-900">Facturación</h1>
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

      <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-3 stagger-in">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm card-lift">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ARCA (AFIP)</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">Facturación electrónica</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-live" />
                <span className="text-xs text-slate-400">Conectado</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ background: '#005691' + '18' }}>
              <Receipt className="w-4 h-4" style={{ color: '#005691' }} />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mercado Pago</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">API Gateway</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-live" />
                <span className="text-xs text-slate-400">Activo para conciliación</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ background: '#00A8E8' + '18' }}>
              <ExternalLink className="w-4 h-4" style={{ color: '#00A8E8' }} />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pendientes</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
                {subscriptions.filter(s => !s.isBilled).length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Items sin facturar</p>
            </div>
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ background: '#f59e0b18' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </div>
          </div>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Items Facturables</CardTitle>
              <CardDescription>Selecciona los items que deseas procesar con ARCA</CardDescription>
            </div>
            <Button
              disabled={selectedIds.size === 0 || processing}
              onClick={handleProcessBilling}
              className="shadow-sm transition-all active:scale-95"
              style={{ background: '#005691' }}
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
            <div className="flex items-center justify-center py-14">
              <Loader2 className="w-6 h-6 animate-spin text-[#00A8E8]" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                <Receipt className="w-7 h-7 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Sin items para facturar</p>
                <p className="text-xs text-slate-400 mt-1">Solo se muestran clientes con pago &quot;Al Día&quot;</p>
              </div>
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
                  <TableHead className="hidden sm:table-cell">DNI</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">Método</TableHead>
                  <TableHead>Estado</TableHead>
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
                      className={`hover:bg-[rgba(0,168,232,0.04)] transition-colors duration-150 ${sub.isBilled ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                      <TableCell>
                        {!sub.isBilled && (
                          <Checkbox
                            checked={selectedIds.has(sub.id)}
                            onCheckedChange={() => toggleSelect(sub.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[160px]">
                        <span className="truncate block">{formatFullName(sub.client.nombre, sub.client.apellido)}</span>
                        {/* Mobile: show method as subtitle */}
                        <span className="sm:hidden text-[10px] text-slate-400 uppercase tracking-wider">
                          {sub.paymentMethod || 'Manual'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-slate-500 text-sm">{sub.client.dni || '---'}</TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {formatCurrency(sub.amount || 0)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
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
