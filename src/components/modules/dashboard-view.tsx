'use client'

import { memo, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { formatCurrency, formatFullName, getPaymentStatusConfig, formatMonthYear } from '@/lib/utils'
import { useAppStore } from '@/store'
import { GroupBadge } from './group-badge'
import { TimeClockWidget } from './time-clock-widget'

// Types
interface DashboardStats {
  totalClients: number
  activeClients: number
  alDiaClients: number
  pendingPayments: number
  overduePayments: number
  todayAttendances: number
  monthRevenue: number
}

interface RecentClient {
  id: string
  nombre: string
  apellido: string
  telefono: string
  grupo: { id: string; name: string; color: string } | null
  createdAt: string
}

interface PendingClient {
  client: {
    id: string
    nombre: string
    apellido: string
    telefono: string
    grupo: { id: string; name: string; color: string } | null
  }
  status: string
}

interface DashboardData {
  stats: DashboardStats
  recentClients: RecentClient[]
  pendingClients: PendingClient[]
  currentMonth: number
  currentYear: number
  groupRevenue: GroupRevenue[]
}

interface GroupRevenue {
  id: string
  name: string
  color: string
  clientCount: number
  revenue: number // Projected
  collected: number // Actual collected
}

interface DashboardViewProps {
  onNavigate: (view: string) => void
}

// Minimalist stat card
const StatCard = memo(function StatCard({
  title,
  value,
  Icon,
  trend,
  accent = '#64748b',
  format,
}: {
  title: string
  value: number
  Icon: React.ComponentType<{ className?: string }>
  trend?: string
  accent?: string
  format?: 'number' | 'currency'
}) {
  const displayValue = format === 'currency'
    ? formatCurrency(value)
    : value.toLocaleString('es-AR')

  return (
    <div
      className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm card-lift"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{displayValue}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        <div
          className="p-2.5 rounded-lg shrink-0 mt-0.5"
          style={{ background: `${accent}18` }}
        >
          <span style={{ color: accent }}>
            <Icon className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  )
})

// Client item
const ClientItem = memo(function ClientItem({ client, showStatus, status }: { 
  client: RecentClient | PendingClient['client']
  showStatus?: boolean
  status?: string 
}) {
  const nombre = 'nombre' in client ? client.nombre : ''
  const apellido = 'apellido' in client ? client.apellido : ''
  const initials = `${nombre[0]}${apellido[0]}`
  const fullName = formatFullName(nombre, apellido)
  const grupo = 'grupo' in client ? client.grupo : null
  const statusConfig = status ? getPaymentStatusConfig(status) : null

  return (
    <div className="flex items-center gap-3 py-2 px-1 rounded-lg transition-colors duration-150 hover:bg-slate-50">
      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-slate-500">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{fullName}</p>
        {grupo && (
          <span 
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${grupo.color}20`, color: grupo.color }}
          >
            {grupo.name}
          </span>
        )}
      </div>
      {showStatus && statusConfig && (
        <Badge variant="outline" className="text-xs font-normal">
          {statusConfig.label}
        </Badge>
      )}
    </div>
  )
})

// Loading skeleton
const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  )
})

// Main component
export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { data: session } = useSession()
  const isEmployee = session?.user?.role === 'EMPLEADO'

  const setDashboardStats = useAppStore((state) => state.setDashboardStats)

  const handleNavigate = useCallback((view: string) => onNavigate(view), [onNavigate])

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Error fetching dashboard')
      const result = await res.json()
      if (result.success) {
        setDashboardStats(result.data.stats)
      }
      return result.data as DashboardData
    },
    staleTime: 60 * 1000, // 1 minute
  })

  const stats = data?.stats
  const recentClients = data?.recentClients ?? []
  const pendingClients = data?.pendingClients ?? []
  const currentMonth = data?.currentMonth ?? new Date().getMonth() + 1
  const currentYear = data?.currentYear ?? new Date().getFullYear()

  const monthLabel = useMemo(() => 
    formatMonthYear(currentMonth, currentYear),
    [currentMonth, currentYear]
  )

  const displayPendingClients = useMemo(() => 
    pendingClients.slice(0, 5),
    [pendingClients]
  )

  if (isLoading) return <DashboardSkeleton />
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">{monthLabel}</p>
        </div>
        <Button 
          onClick={() => handleNavigate('clientes')} 
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <Users className="w-4 h-4" />
          Ver Clientes
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 stagger-in">
        <StatCard
          title="Clientes"
          value={stats?.totalClients ?? 0}
          Icon={Users}
          trend="Total registrados"
          accent="#005691"
        />
        <StatCard
          title="Activos"
          value={stats?.activeClients ?? 0}
          Icon={UserCheck}
          trend="Este mes"
          accent="#10b981"
        />
        <StatCard
          title="Pendientes"
          value={stats?.pendingPayments ?? 0}
          Icon={Clock}
          trend="Por cobrar"
          accent="#f59e0b"
        />
        <StatCard
          title="Hoy"
          value={stats?.todayAttendances ?? 0}
          Icon={Calendar}
          trend="Asistencias"
          accent="#00A8E8"
        />
      </div>

      {/* Employee View */}
      {isEmployee && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TimeClockWidget />
          </div>
          <div className="lg:col-span-2">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Pagos Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingClients.length === 0
                  ? <div className="text-center py-8">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-sm text-slate-400">Todo al día</p>
                    </div>
                  : <div className="divide-y divide-slate-100">
                      {displayPendingClients.map((item) => (
                        <ClientItem
                          key={item.client.id}
                          client={item.client}
                          showStatus
                          status={item.status}
                        />
                      ))}
                    </div>
                }
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Admin View */}
      {!isEmployee && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Revenue */}
          <Card className="border-slate-100 shadow-sm card-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Ingresos del mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">
                {formatCurrency(stats?.monthRevenue ?? 0)}
              </div>
              <p className="text-xs text-slate-400 mt-2">Mes actual</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Al día</span>
                  <span>{stats?.alDiaClients ?? 0} de {stats?.activeClients ?? 0}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full progress-bar-animated"
                    style={{
                      width: `${stats?.activeClients
                        ? ((stats.alDiaClients) / stats.activeClients) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
              {data?.groupRevenue && data.groupRevenue.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs font-medium text-slate-500 mb-2">Ingresos por Grupo</p>
                  <div className="space-y-3">
                    {data.groupRevenue.map((group) => (
                      <div key={group.id} className="p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            <span className="font-medium text-slate-800" style={{ color: group.color }}>{group.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">{group.clientCount} clientes</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-slate-400 uppercase">Proyección</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {formatCurrency(group.revenue)}
                            </p>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <p className="text-[10px] text-slate-400 uppercase">Cobrado</p>
                            <p className="text-sm font-semibold text-emerald-600">
                              {formatCurrency(group.collected)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full progress-bar-animated"
                            style={{
                              width: `${group.revenue > 0 ? (group.collected / group.revenue) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card className="border-slate-100 shadow-sm card-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentClients.length === 0
                ? <div className="text-center py-8 px-4">
                    <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Aún no hay clientes registrados</p>
                  </div>
                : <div className="divide-y divide-slate-100">
                    {recentClients.map((client) => (
                      <ClientItem key={client.id} client={client} />
                    ))}
                  </div>
              }
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="border-slate-100 shadow-sm card-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingClients.length === 0
                ? <div className="text-center py-8 px-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-sm text-slate-400">Todo al día</p>
                  </div>
                : <div className="divide-y divide-slate-100">
                    {displayPendingClients.map((item) => (
                      <ClientItem
                        key={item.client.id}
                        client={item.client}
                        showStatus
                        status={item.status}
                      />
                    ))}
                  </div>
              }
              {pendingClients.length > 5 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => handleNavigate('pagos')}
                >
                  Ver todos ({pendingClients.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default DashboardView
