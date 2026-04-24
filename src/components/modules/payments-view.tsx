'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
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
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle2, AlertTriangle, Clock, Filter, Loader2, AlertCircle, Send } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatFullName, getPaymentStatusConfig, formatMonthYear, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { GroupBadge } from './group-badge'
import { GroupTabs } from './group-tabs'
import { useAppStore } from '@/store'
import { ReceiptUploadDialog } from './payments/receipt-upload-dialog'
import { formatCurrency } from '@/lib/utils'
import { queryClient } from '@/lib/queryClient'
import { toast } from 'sonner'


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
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'EMPLEADORA'

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


  const storeGroups = useAppStore((state) => state.groups)

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('month', selectedMonth.toString())
      params.set('year', selectedYear.toString())

      const response = await fetch(`/api/subscriptions?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        // Re-fetch to ensure server state matches UI
        await fetchSubscriptions()
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        // Invalidate all related caches so other views (clients-view, client-profile) get fresh data
        queryClient.invalidateQueries({ queryKey: ['clients'] })
        queryClient.invalidateQueries({ queryKey: ['client'] })
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
        if (newStatus === 'AL_DIA') {
          toast.success(`Pago registrado (${paymentMethod === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'})`)
        }
      } else {
        toast.error(result.error || 'Error al actualizar el estado')
      }
    } catch (error) {
      toast.error('Error de conexión')
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


  const filteredSubscriptions = useMemo(() => subscriptions.filter(s => {
    const matchesStatus = !statusFilter || s.status === statusFilter
    const matchesGroup = !selectedGrupo || s.client.grupo?.id === selectedGrupo
    return matchesStatus && matchesGroup
  }), [subscriptions, statusFilter, selectedGrupo])

  const stats = useMemo(() => ({
    total: subscriptions.length,
    alDia: subscriptions.filter(s => s.status === 'AL_DIA').length,
    pendiente: subscriptions.filter(s => s.status === 'PENDIENTE').length,
    deudor: subscriptions.filter(s => s.status === 'DEUDOR').length,
  }), [subscriptions])

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [selectedYear - 1, selectedYear, selectedYear + 1]

  // Pre-compute today check outside JSX for performance
  const isLateInMonth = new Date().getDate() > 10

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pagos y Suscripciones</h1>
          <p className="text-muted-foreground">
            Gestión de estados de pago
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 stagger-in">
        {[
          { label: 'Total', value: stats.total, icon: CreditCard, accent: 'var(--muted-foreground)' },
          { label: 'Al Día', value: stats.alDia, icon: CheckCircle2, accent: 'var(--success)' },
          { label: 'Pendientes', value: stats.pendiente, icon: Clock, accent: 'var(--warning)' },
          { label: 'Deudores', value: stats.deudor, icon: AlertTriangle, accent: 'var(--destructive)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-background p-3 sm:p-4 rounded-xl border border-border shadow-sm card-lift"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{stat.value}</p>
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
          isAdmin={isAdmin}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: '', label: 'Todos' },
            { value: 'AL_DIA', label: 'Al Día', accent: 'var(--success)' },
            { value: 'PENDIENTE', label: 'Pendiente', accent: 'var(--warning)' },
            { value: 'DEUDOR', label: 'Deudor', accent: 'var(--destructive)' },
          ].map((filter) => {
            const isActive = statusFilter === filter.value
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className="h-8 px-3 text-xs font-medium rounded-lg border transition-all"
                style={{
                  background: isActive ? (filter.accent ?? 'var(--primary)') : 'var(--background)',
                  color: isActive ? 'white' : 'var(--foreground)',
                  borderColor: isActive ? (filter.accent ?? 'var(--primary)') : 'var(--border)',
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
            className="h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
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
            className="h-8 px-2 rounded-lg border border-input bg-background text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-muted/50/50 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="hidden sm:block">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <EmptyState
              illustration="payments"
              title="Sin suscripciones"
              description="No hay registros para el período y filtros seleccionados"
              className="py-14"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Grupo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden md:table-cell">Clases</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub, index) => {
                    const statusConfig = getPaymentStatusConfig(sub.status)
                    const isLate = isLateInMonth && sub.status === 'PENDIENTE'
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
                            {isLate && (
                              <div className="absolute -left-2 top-0">
                                <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />
                              </div>
                            )}
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm bg-gradient-to-br from-primary to-secondary">
                                <AvatarFallback className="text-white text-sm">
                                  {sub.client.nombre[0]}{sub.client.apellido[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {formatFullName(sub.client.nombre, sub.client.apellido)}
                                </p>
                                <p className="text-xs text-muted-foreground">{sub.client.telefono}</p>
                                {/* Mobile: show group inline */}
                                {sub.client.grupo && (
                                  <span className="sm:hidden text-[10px] font-medium" style={{ color: sub.client.grupo.color || 'var(--secondary)' }}>
                                    {sub.client.grupo.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <GroupBadge group={sub.client.grupo} size="sm" />
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig.color} border transition-transform hover:scale-105`}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
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
                                    className="h-9 sm:h-8 text-xs text-[var(--success)] hover:bg-[var(--success)]/10"
                                    onClick={() => handlePaymentClick(sub, 'EFECTIVO')}
                                    disabled={updating === sub.id}
                                    title="Marcar pagado en efectivo"
                                  >
                                    {updating === sub.id ? <Loader2 className="w-3 h-3 animate-spin sm:mr-1" /> : <CheckCircle2 className="w-3 h-3 sm:mr-1" />}
                                    <span className="hidden sm:inline">Efectivo</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 sm:h-8 text-xs text-[var(--success)] hover:bg-[var(--success)]/10"
                                    onClick={() => handlePaymentClick(sub, 'TRANSFERENCIA')}
                                    disabled={updating === sub.id}
                                    title="Marcar pagado por transferencia"
                                  >
                                    {updating === sub.id ? <Loader2 className="w-3 h-3 animate-spin sm:mr-1" /> : <Send className="w-3 h-3 sm:mr-1" />}
                                    <span className="hidden sm:inline">Transf.</span>
                                  </Button>

                                </>
                              ) : (
                                <Badge variant="outline" className="h-8 text-xs bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20">
                                  Pagado ({sub.paymentMethod === 'EFECTIVO' ? 'Efe' : sub.paymentMethod === 'TRANSFERENCIA' ? 'Transf' : '?'})
                                </Badge>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-9 sm:h-8 w-9 sm:w-8 p-0 ${sub.status === 'PENDIENTE' ? 'text-[var(--warning)] bg-[var(--warning)]/10' : 'text-muted-foreground'}`}
                                onClick={() => handleStatusChange(sub.id, 'PENDIENTE')}
                                disabled={updating === sub.id || sub.status === 'PENDIENTE'}
                                title="Marcar como Pendiente"
                              >
                                <Clock className="w-3 h-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-9 sm:h-8 w-9 sm:w-8 p-0 ${sub.status === 'DEUDOR' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'}`}
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
                  </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pendingSub && (
        <ReceiptUploadDialog
          open={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          onSuccess={(invoiceId) => {
            if (invoiceId) {
              setIsReceiptOpen(false)
              handleStatusChange(pendingSub.id, 'AL_DIA', 'TRANSFERENCIA')
              setPendingSub(null)
            }
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
