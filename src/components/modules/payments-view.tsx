'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
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

// BOLT OPTIMIZATION: Extracting subscription row to a memoized component.
// This prevents all rows from re-rendering when the 'updating' ID or other parent states change.
const SubscriptionRow = memo(({
  sub,
  index,
  isUpdating,
  onPaymentClick,
  onStatusChange
}: {
  sub: Subscription,
  index: number,
  isUpdating: boolean,
  onPaymentClick: (sub: Subscription, method: string) => void,
  onStatusChange: (id: string, status: string) => void
}) => {
  const statusConfig = getPaymentStatusConfig(sub.status)
  const today = new Date()
  const isLate = today.getDate() > 10 && sub.status === 'PENDIENTE'

  return (
    <motion.tr
      className="hover:bg-slate-50/50 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <TableCell>
        <div className="flex items-center gap-3 relative">
          {isLate && (
            <div className="absolute -left-2 top-0">
              <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
          )}
          <Avatar className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-sky-600 ring-2 ring-white shadow-md">
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
          <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} mr-1.5`} />
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
                onClick={() => onPaymentClick(sub, 'EFECTIVO')}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                Efectivo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-emerald-600 hover:bg-emerald-50"
                onClick={() => onPaymentClick(sub, 'TRANSFERENCIA')}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
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
            onClick={() => onStatusChange(sub.id, 'PENDIENTE')}
            disabled={isUpdating || sub.status === 'PENDIENTE'}
            title="Marcar como Pendiente"
          >
            <Clock className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className={`h-8 w-8 p-0 ${sub.status === 'DEUDOR' ? 'text-red-600 bg-red-50' : 'text-slate-400'}`}
            onClick={() => onStatusChange(sub.id, 'DEUDOR')}
            disabled={isUpdating || sub.status === 'DEUDOR'}
            title="Marcar como Deudor"
          >
            <AlertTriangle className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
    </motion.tr>
  )
})
SubscriptionRow.displayName = 'SubscriptionRow'

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

  const handleStatusChange = useCallback(async (subscriptionId: string, newStatus: string, paymentMethod?: string) => {
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
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    } finally {
      setUpdating(null)
    }
  }, [])

  const handlePaymentClick = useCallback((sub: Subscription, method: string) => {
    if (method === 'TRANSFERENCIA') {
      setPendingSub(sub)
      setIsReceiptOpen(true)
    } else {
      handleStatusChange(sub.id, 'AL_DIA', method)
    }
  }, [handleStatusChange])


  // BOLT OPTIMIZATION: Memoize filtered list to prevent unnecessary re-filtering.
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      const matchesStatus = !statusFilter || s.status === statusFilter
      const matchesGroup = !selectedGrupo || s.client.grupo?.id === selectedGrupo
      return matchesStatus && matchesGroup
    })
  }, [subscriptions, statusFilter, selectedGrupo])

  // BOLT OPTIMIZATION: Use single-pass reduce for stats calculation (O(N) instead of O(4N))
  // and wrap in useMemo to prevent recalculation on every render.
  const stats = useMemo(() => {
    return subscriptions.reduce((acc, s) => {
      acc.total++
      if (s.status === 'AL_DIA') acc.alDia++
      else if (s.status === 'PENDIENTE') acc.pendiente++
      else if (s.status === 'DEUDOR') acc.deudor++
      return acc
    }, { total: 0, alDia: 0, pendiente: 0, deudor: 0 })
  }, [subscriptions])

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [selectedYear - 1, selectedYear, selectedYear + 1]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos y Suscripciones</h1>
          <p className="text-slate-500">
            Gestión de estados de pago
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: CreditCard, bg: 'bg-slate-100', color: 'text-slate-600' },
          { label: 'Al Día', value: stats.alDia, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600' },
          { label: 'Pendientes', value: stats.pendiente, icon: Clock, bg: 'bg-amber-100', color: 'text-amber-600' },
          { label: 'Deudores', value: stats.deudor, icon: AlertTriangle, bg: 'bg-red-100', color: 'text-red-600' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${stat.bg} rounded-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: '', label: 'Todos' },
                { value: 'AL_DIA', label: 'Al Día', activeClass: 'bg-emerald-600' },
                { value: 'PENDIENTE', label: 'Pendiente', activeClass: 'bg-amber-600' },
                { value: 'DEUDOR', label: 'Deudor', activeClass: 'bg-red-600' },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                  className={statusFilter === filter.value ? filter.activeClass : ''}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
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
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-500">
              <CreditCard className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium">No hay suscripciones</p>
              <p className="text-sm">No se encontraron registros para el período seleccionado</p>
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
                    {filteredSubscriptions.map((sub, index) => (
                      <SubscriptionRow
                        key={sub.id}
                        sub={sub}
                        index={index}
                        isUpdating={updating === sub.id}
                        onPaymentClick={handlePaymentClick}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
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
