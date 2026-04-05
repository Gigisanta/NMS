'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
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
      className={`border-b border-slate-100 transition-colors duration-150 ${
        isLimitReached ? 'bg-red-50/30' : 'hover:bg-[rgba(0,168,232,0.04)]'
      }`}
    >
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-1 ring-white shrink-0" style={{ background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)' }}>
            <AvatarFallback className="text-white text-xs font-medium">
              {client.nombre[0]}{client.apellido[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="font-medium text-slate-900 text-sm truncate block max-w-[140px]">
              {formatFullName(client.nombre, client.apellido)}
            </span>
            {/* Mobile subtitle: group + classes */}
            <div className="sm:hidden flex items-center gap-1.5 mt-0.5">
              {client.grupo && (
                <span className="text-[10px] text-slate-500 truncate">{client.grupo.name}</span>
              )}
              <span className={`text-[10px] font-medium ${isLimitReached ? 'text-red-500' : 'text-slate-400'}`}>
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
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full progress-bar-animated ${isLimitReached ? 'bg-red-400' : ''}`}
              style={{ width: `${progressPercent}%`, ...(!isLimitReached ? { background: '#00A8E8' } : {}) }}
            />
          </div>
          <span className={`text-xs font-medium ${isLimitReached ? 'text-red-600' : 'text-slate-600'}`}>
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
          <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            {todayCount}
          </span>
        )}
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={isLimitReached ? "ghost" : "default"}
            className={`h-9 sm:h-8 gap-1 transition-all ${isLimitReached ? 'text-slate-400 cursor-not-allowed' : 'text-white'}`}
            style={!isLimitReached ? { background: '#005691' } : {}}
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
              className="h-9 sm:h-8 gap-1 text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200"
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
      className="flex items-center justify-between p-2 bg-slate-50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium">
          {formatFullName(attendance.client.nombre, attendance.client.apellido)}
        </span>
        <GroupBadge group={attendance.client.grupo} size="sm" />
      </div>
      <span className="text-xs text-slate-500">
        {formatTime(attendance.date)}
      </span>
    </motion.div>
  )
})

export function AttendanceView() {
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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const clientsParams = new URLSearchParams()
      clientsParams.set('withSubscription', 'true')
      if (selectedGrupo) clientsParams.set('grupoId', selectedGrupo)

      const [clientsRes, attendanceRes, groupsRes] = await Promise.all([
        fetch(`/api/clients?${clientsParams}`),
        fetch('/api/attendance?today=true'),
        shouldFetchGroups ? fetch('/api/groups') : null,
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
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedGrupo, shouldFetchGroups, setGroups])

  useEffect(() => {
    fetchData()
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
      console.error('Error marking attendance:', error)
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev }
        delete newUpdates[client.id]
        return newUpdates
      })
    } finally {
      setMarkingAttendance(null)
    }
  }, [optimisticUpdates, fetchData])

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
    } finally {
      setRemovingAttendance(null)
    }
  }, [fetchData])

  // BOLT OPTIMIZATION: Convert O(N*M) lookup to O(N+M) by pre-calculating counts in a Map.
  // This prevents filtering the entire todayAttendance array for every client row.
  const attendanceCountsMap = useMemo(() => {
    const counts = new Map<string, number>()
    todayAttendance.forEach(a => {
      counts.set(a.clientId, (counts.get(a.clientId) || 0) + 1)
    })
    return counts
  }, [todayAttendance])

  const getClientAttendanceToday = useCallback((clientId: string) => {
    return attendanceCountsMap.get(clientId) || 0
  }, [attendanceCountsMap])

  const getClientLatestAttendanceId = useCallback((clientId: string) => {
    const attendance = todayAttendance.find(a => a.clientId === clientId)
    return attendance?.id ?? null
  }, [todayAttendance])

  const getClassesUsed = useCallback((client: Client) => {
    return optimisticUpdates[client.id]?.classesUsed ?? client.currentSubscription?.classesUsed ?? 0
  }, [optimisticUpdates])

  // Memoized filtered clients for performance
  const filteredClients = useMemo(() => {
    if (!selectedGrupo) return clients
    return clients.filter(client => client.grupo?.id === selectedGrupo)
  }, [clients, selectedGrupo])

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
            <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-52 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-56 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
        <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
          <div className="p-3 border-b bg-slate-50 grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />)}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border-b border-slate-50">
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-slate-100 rounded animate-pulse sm:hidden" />
              </div>
              <div className="ml-auto w-16 h-8 bg-slate-100 rounded animate-pulse" />
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
          <h1 className="text-xl font-semibold text-slate-900">Asistencias</h1>
          <p className="text-slate-500">
            {formatDate(new Date())} - {todayAttendance.length} asistencias registradas
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
          <Calendar className="w-4 h-4" style={{ color: '#00A8E8' }} />
          <span className="capitalize">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Group Tabs */}
      {storeGroups && storeGroups.length > 0 && (
        <GroupTabs
          groups={storeGroups}
          selectedId={selectedGrupo}
          onChange={setSelectedGrupo}
        />
      )}

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-14">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Users className="w-7 h-7 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {selectedGrupo ? 'Sin alumnos en este grupo' : 'Sin alumnos registrados'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedGrupo
                    ? 'Probá seleccionando otro grupo o quitando el filtro'
                    : 'Agregá clientes para empezar a registrar asistencias'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Alumno</th>
                  <th className="hidden sm:table-cell text-left py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Grupo</th>
                  <th className="hidden sm:table-cell text-left py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Clases</th>
                  <th className="hidden md:table-cell text-left py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Hoy</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredClients.map((client, index) => (
                    <AttendanceTableRow
                      key={client.id}
                      client={client}
                      index={index}
                      onMarkAttendance={handleAttendance}
                      onRemoveAttendance={handleRemoveAttendance}
                      isMarking={markingAttendance === client.id}
                      isRemoving={removingAttendance === getClientLatestAttendanceId(client.id)}
                      optimisticClassesUsed={optimisticUpdates[client.id]?.classesUsed ?? null}
                      todayCount={getClientAttendanceToday(client.id)}
                      todayAttendanceId={getClientLatestAttendanceId(client.id)}
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
        <Card className="border-slate-100 shadow-sm">
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
