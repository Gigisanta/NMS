'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
  AlertCircle,
  Send
} from 'lucide-react'
import { formatFullName, getPaymentStatusConfig, formatMonthYear, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { GroupBadge } from './group-badge'
import { GroupTabs } from './group-tabs'
import { useAppStore } from '@/store'
import { ReceiptUploadDialog } from './payments/receipt-upload-dialog'
import { formatCurrency } from '@/lib/utils'


interface Group {
  id: string
  name: string
  color: string
}

interface Subscription {
  id: string
  clientId: string
  month: number
  year: number
  status: string
  classesTotal: number
  classesUsed: number
  amount: number | null
  paymentMethod?: string | null
  isBilled?: boolean
  client: {
    id: string
    nombre: string
    apellido: string
    telefono: string
    grupo: Group | null
  }
}

export function PaymentsView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedYear, setSelectedYear] = useState(getCurrentYear())
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  
  // Receipt upload state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [pendingSub, setPendingSub] = useState<Subscription | null>(null)


  const storeGroups = useAppStore((state) => (state as any).groups)

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('month', selectedMonth.toString())
      params.set('year', selectedYear.toString())

      const response = await fetch(`/api/subscriptions?${params}`)
      const result = await response.json()
      if (result.success) {
        setSubscriptions(result.data)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const handleStatusChange = async (subscriptionId: string, newStatus: string, paymentMethod?: string) => {
    setUpdating(subscriptionId)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(paymentMethod ? { paymentMethod } : {})
        }),
      })

      const result = await response.json()
      if (result.success) {
        setSubscriptions(prev =>
          prev.map(s => s.id === subscriptionId ? { ...s, status: newStatus, paymentMethod: paymentMethod || s.paymentMethod } : s)
        )
        useAppStore.getState().invalidateDashboard?.()
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handlePaymentClick = (sub: Subscription, method: string) => {
    if (method === 'TRANSFERENCIA') {
      setPendingSub(sub)
      setIsReceiptOpen(true)
    } else {
      handleStatusChange(sub.id, 'AL_DIA', method)
    }
  }


  const filteredSubscriptions = subscriptions.filter(s => {
    const matchesStatus = !statusFilter || s.status === statusFilter
    const matchesGroup = !selectedGrupo || s.client.grupo?.id === selectedGrupo
    return matchesStatus && matchesGroup
  })

  const stats = {
    total: subscriptions.length,
    alDia: subscriptions.filter(s => s.status === 'AL_DIA').length,
    pendiente: subscriptions.filter(s => s.status === 'PENDIENTE').length,
    deudor: subscriptions.filter(s => s.status === 'DEUDOR').length,
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [selectedYear - 1, selectedYear, selectedYear + 1]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pagos y Suscripciones</h1>
          <p className="text-slate-500">
            Gestión de estados de pago
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 stagger-in">
        {[
          { label: 'Total', value: stats.total, icon: CreditCard, accent: '#64748b' },
          { label: 'Al Día', value: stats.alDia, icon: CheckCircle2, accent: '#10b981' },
          { label: 'Pendientes', value: stats.pendiente, icon: Clock, accent: '#f59e0b' },
          { label: 'Deudores', value: stats.deudor, icon: AlertTriangle, accent: '#ef4444' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm card-lift"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{stat.value}</p>
              </div>
              <div
                className="p-2.5 rounded-lg mt-0.5 shrink-0"
                style={{ background: `${stat.accent}18` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Group Tabs */}
      {storeGroups && storeGroups.length > 0 && (
        <GroupTabs
          groups={storeGroups}
          selectedId={selectedGrupo}
          onChange={setSelectedGrupo}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: '', label: 'Todos' },
            { value: 'AL_DIA', label: 'Al Día', accent: '#10b981' },
            { value: 'PENDIENTE', label: 'Pendiente', accent: '#f59e0b' },
            { value: 'DEUDOR', label: 'Deudor', accent: '#ef4444' },
          ].map((filter) => {
            const isActive = statusFilter === filter.value
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className="h-8 px-3 text-xs font-medium rounded-lg border transition-all"
                style={{
                  background: isActive ? (filter.accent ?? '#1e293b') : 'white',
                  color: isActive ? 'white' : '#475569',
                  borderColor: isActive ? (filter.accent ?? '#1e293b') : '#e2e8f0',
                }}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
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
            className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00A8E8' }} />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Sin suscripciones</p>
                <p className="text-xs text-slate-400 mt-1">No hay registros para el período y filtros seleccionados</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-450px)] min-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur z-10">
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Clases</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredSubscriptions.map((sub, index) => {
                      const statusConfig = getPaymentStatusConfig(sub.status)
                      return (
                        <motion.tr
                          key={sub.id}
                          className="hover:bg-[rgba(0,168,232,0.04)] transition-colors duration-150"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.025, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3 relative">
                              {(() => {
                                const today = new Date()
                                const isLate = today.getDate() > 10 && sub.status === 'PENDIENTE'
                                return isLate && (
                                  <div className="absolute -left-2 top-0">
                                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                  </div>
                                )
                              })()}
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm" style={{ background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)' }}>
                                <AvatarFallback className="text-white text-sm">
                                  {sub.client.nombre[0]}{sub.client.apellido[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {formatFullName(sub.client.nombre, sub.client.apellido)}
                                </p>
                                <p className="text-xs text-slate-500">{sub.client.telefono}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <GroupBadge group={sub.client.grupo} size="sm" />
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig.color} border transition-transform hover:scale-105`}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {sub.classesUsed}/{sub.classesTotal}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {sub.status !== 'AL_DIA' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => handlePaymentClick(sub, 'EFECTIVO')}
                                    disabled={updating === sub.id}
                                  >
                                    {updating === sub.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    Efectivo
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => handlePaymentClick(sub, 'TRANSFERENCIA')}
                                    disabled={updating === sub.id}
                                  >
                                    {updating === sub.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    Transf.
                                  </Button>

                                </>
                              ) : (
                                <Badge variant="outline" className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Pagado ({sub.paymentMethod === 'EFECTIVO' ? 'Efe' : 'Transf'})
                                </Badge>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 ${sub.status === 'PENDIENTE' ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}
                                onClick={() => handleStatusChange(sub.id, 'PENDIENTE')}
                                disabled={updating === sub.id || sub.status === 'PENDIENTE'}
                                title="Marcar como Pendiente"
                              >
                                <Clock className="w-3 h-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 ${sub.status === 'DEUDOR' ? 'text-red-600 bg-red-50' : 'text-slate-400'}`}
                                onClick={() => handleStatusChange(sub.id, 'DEUDOR')}
                                disabled={updating === sub.id || sub.status === 'DEUDOR'}
                                title="Marcar como Deudor"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {pendingSub && (
        <ReceiptUploadDialog
          open={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          onSuccess={() => {
            setIsReceiptOpen(false)
            handleStatusChange(pendingSub.id, 'AL_DIA', 'TRANSFERENCIA')
            setPendingSub(null)
          }}
          clientId={pendingSub.client.id}
          subscriptionId={pendingSub.id}
          clientName={formatFullName(pendingSub.client.nombre, pendingSub.client.apellido)}
          periodLabel={formatMonthYear(pendingSub.month, pendingSub.year)}
        />
      )}
    </div>

  )
}
