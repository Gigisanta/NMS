'use client'

import { useEffect, useState, memo, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
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
}

interface DashboardViewProps {
  onNavigate: (view: string) => void
}

// Minimalist stat card
const StatCard = memo(function StatCard({ 
  title, 
  value, 
  Icon,
  trend 
}: { 
  title: string
  value: number
  Icon: React.ComponentType<{ className?: string }>
  trend?: string
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-400 mt-0.5">{trend}</p>}
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon className="w-4 h-4 text-slate-400" />
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
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
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
  
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const dashboardStats = useAppStore((state) => state.dashboardStats)
  const setDashboardStats = useAppStore((state) => state.setDashboardStats)
  const dashboardLastFetch = useAppStore((state) => state.dashboardLastFetch)

  const handleNavigate = useCallback((view: string) => onNavigate(view), [onNavigate])

  const shouldFetch = useMemo(() => 
    Date.now() - dashboardLastFetch > 2 * 60 * 1000,
    [dashboardLastFetch]
  )

  useEffect(() => {
    let mounted = true

    async function fetchDashboard() {
      if (dashboardStats && !shouldFetch) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/dashboard')
        const result = await response.json()
        if (mounted && result.success) {
          setData(result.data)
          setDashboardStats(result.data.stats)
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDashboard()
    
    return () => { mounted = false }
  }, [shouldFetch, dashboardStats, setDashboardStats])

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

  if (loading) return <DashboardSkeleton />
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
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard 
          title="Clientes" 
          value={stats?.totalClients ?? 0}
          Icon={Users}
          trend="Total registrados"
        />
        <StatCard 
          title="Activos" 
          value={stats?.activeClients ?? 0}
          Icon={UserCheck}
          trend="Este mes"
        />
        <StatCard 
          title="Pendientes" 
          value={stats?.pendingPayments ?? 0}
          Icon={Clock}
          trend="Por cobrar"
        />
        <StatCard 
          title="Hoy" 
          value={stats?.todayAttendances ?? 0}
          Icon={Calendar}
          trend="Asistencias"
        />
      </div>

      {/* Employee View */}
      {isEmployee && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TimeClockWidget />
          </div>
          <div className="lg:col-span-2">
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Pagos Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingClients.length === 0 
                  ? <div className="text-center py-6">
                      <p className="text-sm text-slate-500">Sin pagos pendientes</p>
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
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Ingresos
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
                  <span>{stats?.activeClients ? stats.activeClients - stats.pendingPayments : 0} de {stats?.activeClients ?? 0}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ 
                      width: `${stats?.activeClients 
                        ? ((stats.activeClients - stats.pendingPayments) / stats.activeClients) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentClients.length === 0 
                ? <div className="text-center py-6">
                    <p className="text-sm text-slate-500">Sin clientes</p>
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
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingClients.length === 0 
                ? <div className="text-center py-6">
                    <p className="text-sm text-slate-500">Sin pagos pendientes</p>
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
