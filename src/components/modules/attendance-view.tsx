'use client'

import { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  Loader2,
  AlertTriangle,
  Filter,
  Check,
  Undo2
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { formatFullName, formatTime, getPaymentStatusConfig, formatDate } from '@/lib/utils'
import { useAppStore } from '@/store'
import { GroupBadge } from './group-badge'
import { GroupTabs } from './group-tabs'
import { toast } from 'sonner'

interface Group {
  id: string
  name: string
  color: string
}

interface Client {
  id: string
  nombre: string
  apellido: string
  telefono: string
  grupo: Group | null
  currentSubscription?: {
    id: string
    status: string
    classesUsed: number
    classesTotal: number
  } | null
}

interface AttendanceRecord {
  id: string
  clientId: string
  date: string
  client: {
    nombre: string
    apellido: string
    grupo: Group | null
  }
}

// Compact table row for attendance
const AttendanceTableRow = memo(function AttendanceTableRow({ 
  client,
  index,
  onMarkAttendance,
  onRemoveAttendance,
  isMarking,
  isRemoving,
  optimisticClassesUsed,
  todayCount,
  todayAttendanceId,
}: { 
  client: Client
  index: number
  onMarkAttendance: (client: Client) => void
  onRemoveAttendance: (attendanceId: string) => void
  isMarking: boolean
  isRemoving: boolean
  optimisticClassesUsed: number | null
  todayCount: number
  todayAttendanceId: string | null
}) {
  const classesUsed = optimisticClassesUsed ?? client.currentSubscription?.classesUsed ?? 0
  const classesTotal = client.currentSubscription?.classesTotal ?? 4
  const status = client.currentSubscription?.status ?? 'PENDIENTE'
  const statusConfig = getPaymentStatusConfig(status)
  const isLimitReached = classesUsed >= classesTotal
  const progressPercent = (classesUsed / classesTotal) * 100

  return (
    <tr
      className={`border-b border-border transition-colors duration-150 ${
        isLimitReached ? 'bg-destructive/10' : 'hover:bg-[rgba(0,168,232,0.04)]'
      }`}
    >
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-1 ring-white shrink-0 bg-gradient-to-br from-primary to-secondary">
            <AvatarFallback className="text-white text-xs font-medium">
              {client.nombre[0]}{client.apellido[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="font-medium text-foreground text-sm truncate block max-w-[140px]">
              {formatFullName(client.nombre, client.apellido)}
            </span>
            {/* Mobile subtitle: group + classes */}
            <div className="sm:hidden flex items-center gap-1.5 mt-0.5">
              {client.grupo && (
                <span className="text-[10px] text-muted-foreground truncate">{client.grupo.name}</span>
              )}
              <span className={`text-[10px] font-medium ${isLimitReached ? 'text-destructive' : 'text-muted-foreground'}`}>
                · {classesUsed}/{classesTotal}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="hidden sm:table-cell py-2 px-3">
        <GroupBadge group={client.grupo} size="sm" />
      </td>
      <td className="hidden sm:table-cell py-2 px-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full progress-bar-animated ${isLimitReached ? 'bg-destructive' : ''}`}
              style={!isLimitReached ? { background: 'var(--secondary)' } : {}}
            />
          </div>
          <span className={`text-xs font-medium ${isLimitReached ? 'text-destructive' : 'text-muted-foreground'}`}>
            {classesUsed}/{classesTotal}
          </span>
        </div>
      </td>
      <td className="hidden md:table-cell py-2 px-3">
        <Badge className={`${statusConfig.color} border text-xs py-0.5`}>
          {statusConfig.label}
        </Badge>
      </td>
      <td className="py-2 px-3 text-center">
        {todayCount > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 bg-[var(--success)]/20 text-[var(--success)] text-xs font-medium rounded-full">
            {todayCount}
          </span>
        )}
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={isLimitReached ? "ghost" : "default"}
            className={`h-9 sm:h-8 gap-1 transition-all ${isLimitReached ? 'text-muted-foreground cursor-not-allowed' : 'text-white'}`}
            style={!isLimitReached ? { background: 'var(--primary)' } : {}}
            onClick={() => onMarkAttendance(client)}
            disabled={isLimitReached || isMarking}
          >
            {isMarking ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isLimitReached ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </Button>
          {todayAttendanceId && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 sm:h-8 gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border"
              onClick={() => onRemoveAttendance(todayAttendanceId)}
              disabled={isRemoving || isMarking}
            >
              {isRemoving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Undo2 className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
})

// Memoized attendance list item
const AttendanceListItem = memo(function AttendanceListItem({ 
  attendance,
  index,
}: { 
  attendance: AttendanceRecord
  index: number
}) {
  return (
    <motion.div 
      className="flex items-center justify-between p-2 bg-muted/50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
        <span className="text-sm font-medium">
          {formatFullName(attendance.client.nombre, attendance.client.apellido)}
        </span>
        <GroupBadge group={attendance.client.grupo} size="sm" />
      </div>
      <span className="text-xs text-muted-foreground">
        {formatTime(attendance.date)}
      </span>
    </motion.div>
  )
})

export function AttendanceView() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'EMPLEADORA'

  // Local state
  const [clients, setClients] = useState<Client[]>([])
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null)
  const [removingAttendance, setRemovingAttendance] = useState<string | null>(null)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, { classesUsed: number }>>({})
  
  // Groups from global store (cached)
  const storeGroups = useAppStore((state) => state.groups)
  const setGroups = useAppStore((state) => state.setGroups)
  const groupsLastFetch = useAppStore((state) => state.groupsLastFetch)
  
  // Check if groups need refresh
  const shouldFetchGroups = useMemo(() =>
    Date.now() - groupsLastFetch > 5 * 60 * 1000 || storeGroups.length === 0,
    [groupsLastFetch, storeGroups.length]
  )

  // AbortController ref to cancel stale requests
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    try {
      const clientsParams = new URLSearchParams()
      clientsParams.set('withSubscription', 'true')
      if (selectedGrupo) clientsParams.set('grupoId', selectedGrupo)

      const [clientsRes, attendanceRes, groupsRes] = await Promise.all([
        fetch(`/api/clients?${clientsParams}`, { signal: abortControllerRef.current.signal }),
        fetch('/api/attendance?today=true', { signal: abortControllerRef.current.signal }),
        shouldFetchGroups ? fetch('/api/groups', { signal: abortControllerRef.current.signal }) : null,
      ])

      const clientsResult = await clientsRes.json()
      const attendanceResult = await attendanceRes.json()

      if (clientsResult.success) {
        setClients(clientsResult.data)
      }

      if (attendanceResult.success) {
        setTodayAttendance(attendanceResult.data)
      }

      if (groupsRes) {
        const groupsResult = await groupsRes.json()
        if (groupsResult.success) {
          setGroups(groupsResult.data)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Error fetching data:', error)
      toast.error('Error de conexión al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [selectedGrupo, shouldFetchGroups, setGroups])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  const handleAttendance = useCallback(async (client: Client) => {
    const currentUsed = optimisticUpdates[client.id]?.classesUsed ?? client.currentSubscription?.classesUsed ?? 0
    const total = client.currentSubscription?.classesTotal ?? 4
    
    if (currentUsed >= total) return

    // Optimistic update
    setOptimisticUpdates(prev => ({
      ...prev,
      [client.id]: { classesUsed: currentUsed + 1 }
    }))

    setMarkingAttendance(client.id)

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      })

      const result = await response.json()

      if (result.success) {
        setTodayAttendance(prev => [{
          id: result.data.attendance.id,
          clientId: client.id,
          date: result.data.attendance.date,
          client: {
            nombre: result.data.client.nombre,
            apellido: result.data.client.apellido,
            grupo: client.grupo,
          },
        }, ...prev])
      } else {
        setOptimisticUpdates(prev => {
          const newUpdates = { ...prev }
          delete newUpdates[client.id]
          return newUpdates
        })
        toast.error(result.error || 'Error al registrar asistencia')
      }
    } catch (error) {
      // ROLLBACK DIRECTO sin fetchData para evitar stale closure
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev }
        delete newUpdates[client.id]
        return newUpdates
      })
      console.error('Error marking attendance:', error)
      toast.error(error instanceof Error ? error.message : 'Error de conexión al registrar asistencia')
    } finally {
      setMarkingAttendance(null)
    }
  }, []) // SIN dependencias externas para evitar stale closure

  const handleRemoveAttendance = useCallback(async (attendanceId: string) => {
    setRemovingAttendance(attendanceId)

    try {
      const response = await fetch(`/api/attendance?id=${attendanceId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setTodayAttendance(prev => prev.filter(a => a.id !== attendanceId))
        fetchData()
      } else {
        toast.error(result.error || 'Error al eliminar asistencia')
      }
    } catch (error) {
      console.error('Error removing attendance:', error)
      toast.error(error instanceof Error ? error.message : 'Error de conexión al eliminar asistencia')
    } finally {
      setRemovingAttendance(null)
    }
  }, [fetchData])

  // Pre-compute attendance counts for O(1) lookup instead of O(N) per row
  const attendanceCountsMap = useMemo(() => {
    const counts = new Map<string, number>()
    todayAttendance.forEach(a => {
      counts.set(a.clientId, (counts.get(a.clientId) || 0) + 1)
    })
    return counts
  }, [todayAttendance])

  // Stable handler for group tab change to prevent re-renders
  const handleGroupChange = useCallback((id: string | null) => {
    setSelectedGrupo(id)
  }, [])

  // Memoized filtered clients for performance
  const filteredClients = useMemo(() => {
    if (!selectedGrupo) return clients
    return clients.filter(client => client.grupo?.id === selectedGrupo)
  }, [clients, selectedGrupo])

  // Pre-compute client rows for performance - avoids re-creating functions in map
  const clientRows = useMemo(() => {
    return filteredClients.map((client) => ({
      client,
      todayCount: attendanceCountsMap.get(client.id) || 0,
      todayAttendanceId: (() => {
        const attendance = todayAttendance.find(a => a.clientId === client.id)
        return attendance?.id ?? null
      })(),
      optimisticClassesUsed: optimisticUpdates[client.id]?.classesUsed ?? null,
    }))
  }, [filteredClients, attendanceCountsMap, todayAttendance, optimisticUpdates])

  // Memoized recent attendance
  const recentAttendance = useMemo(() => 
    todayAttendance.slice(0, 10),
    [todayAttendance]
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-52 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-56 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
        <div className="rounded-xl border border-border overflow-hidden bg-background shadow-sm">
          <div className="p-3 border-b bg-muted/50 grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-muted rounded animate-pulse" />)}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 bg-muted rounded animate-pulse" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse sm:hidden" />
              </div>
              <div className="ml-auto w-16 h-8 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Asistencias</h1>
          <p className="text-muted-foreground">
            {formatDate(new Date())} - {todayAttendance.length} asistencias registradas
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-4 py-2 rounded-lg border border-border shadow-sm">
          <Calendar className="w-4 h-4 text-secondary" />
          <span className="capitalize">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Group Tabs */}
      {storeGroups && storeGroups.length > 0 && (
        <GroupTabs
          groups={storeGroups}
          selectedId={selectedGrupo}
          onChange={handleGroupChange}
          isAdmin={isAdmin}
        />
      )}

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <EmptyState
          illustration="attendance"
          title={selectedGrupo ? 'Sin alumnos en este grupo' : 'Sin alumnos registrados'}
          description={selectedGrupo
            ? 'Probá seleccionando otro grupo o quitando el filtro'
            : 'Agregá clientes para empezar a registrar asistencia'}
        />
      ) : (
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alumno</th>
                  <th className="hidden sm:table-cell text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grupo</th>
                  <th className="hidden sm:table-cell text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clases</th>
                  <th className="hidden md:table-cell text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hoy</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {clientRows.map(({ client, todayCount, todayAttendanceId, optimisticClassesUsed }) => (
                    <AttendanceTableRow
                      key={client.id}
                      client={client}
                      index={0}
                      onMarkAttendance={handleAttendance}
                      onRemoveAttendance={handleRemoveAttendance}
                      isMarking={markingAttendance === client.id}
                      isRemoving={removingAttendance === todayAttendanceId}
                      optimisticClassesUsed={optimisticClassesUsed}
                      todayCount={todayCount}
                      todayAttendanceId={todayAttendanceId}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Today's Attendance List */}
      {recentAttendance.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Asistencias de Hoy</CardTitle>
            <CardDescription>Últimas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                <AnimatePresence>
                  {recentAttendance.map((attendance, index) => (
                    <AttendanceListItem 
                      key={attendance.id}
                      attendance={attendance}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
