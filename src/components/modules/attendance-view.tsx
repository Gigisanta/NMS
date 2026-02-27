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
  Filter
} from 'lucide-react'
import { formatFullName, formatTime, getPaymentStatusConfig, formatDate } from '@/lib/utils'
import { useAppStore } from '@/store'
import { GroupBadge } from './group-badge'

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

// Memoized client card component
const ClientAttendanceCard = memo(function ClientAttendanceCard({ 
  client,
  index,
  onMarkAttendance,
  isMarking,
  optimisticClassesUsed,
  todayCount,
}: { 
  client: Client
  index: number
  onMarkAttendance: (client: Client) => void
  isMarking: boolean
  optimisticClassesUsed: number | null
  todayCount: number
}) {
  const classesUsed = optimisticClassesUsed ?? client.currentSubscription?.classesUsed ?? 0
  const classesTotal = client.currentSubscription?.classesTotal ?? 4
  const status = client.currentSubscription?.status ?? 'PENDIENTE'
  const statusConfig = getPaymentStatusConfig(status)
  const isLimitReached = classesUsed >= classesTotal
  
  const progressPercent = useMemo(() => 
    (classesUsed / classesTotal) * 100,
    [classesUsed, classesTotal]
  )

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card 
        className={`border-0 shadow-lg bg-white/80 backdrop-blur transition-all duration-200 ${
          isLimitReached ? 'ring-2 ring-red-200' : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-cyan-500 to-sky-600 ring-2 ring-white shadow-md">
                <AvatarFallback className="text-white font-medium">
                  {client.nombre[0]}{client.apellido[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-slate-900">
                  {formatFullName(client.nombre, client.apellido)}
                </p>
                <GroupBadge group={client.grupo} size="sm" />
              </div>
            </div>
            <Badge className={`${statusConfig.color} border text-xs`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Classes Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-500">Clases</span>
              <span className={`font-medium ${isLimitReached ? 'text-red-600' : 'text-slate-900'}`}>
                {classesUsed}/{classesTotal}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${
                  isLimitReached 
                    ? 'bg-gradient-to-r from-red-400 to-red-500' 
                    : 'bg-gradient-to-r from-cyan-500 to-sky-600'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {isLimitReached && (
              <motion.div 
                className="flex items-center gap-1 mt-2 text-xs text-red-600"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertTriangle className="w-3 h-3" />
                Límite alcanzado
              </motion.div>
            )}
          </div>

          {/* Today's attendance */}
          {todayCount > 0 && (
            <div className="mb-3 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1">
              Ya registró {todayCount} asistencia{todayCount > 1 ? 's' : ''} hoy
            </div>
          )}

          {/* Action Button */}
          <Button
            className={`w-full gap-2 transition-all ${
              isLimitReached 
                ? 'bg-slate-100 text-slate-400 hover:bg-slate-100' 
                : 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 hover:shadow-lg'
            }`}
            onClick={() => onMarkAttendance(client)}
            disabled={isLimitReached || isMarking}
          >
            {isMarking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : isLimitReached ? (
              <>
                <XCircle className="w-4 h-4" />
                Sin clases disponibles
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Marcar Asistencia
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
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
      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
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
  const [selectedGrupo, setSelectedGrupo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null)
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

        // Refresh data to get updated subscription
        fetchData()
      } else {
        setOptimisticUpdates(prev => {
          const newUpdates = { ...prev }
          delete newUpdates[client.id]
          return newUpdates
        })
        alert(result.error || 'Error al registrar asistencia')
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

  // Memoized computed values
  const getClientAttendanceToday = useCallback((clientId: string) => {
    return todayAttendance.filter(a => a.clientId === clientId).length
  }, [todayAttendance])

  const getClassesUsed = useCallback((client: Client) => {
    return optimisticUpdates[client.id]?.classesUsed ?? client.currentSubscription?.classesUsed ?? 0
  }, [optimisticUpdates])

  // Memoized filtered clients for performance
  const filteredClients = useMemo(() => clients, [clients])

  // Memoized recent attendance
  const recentAttendance = useMemo(() => 
    todayAttendance.slice(0, 10),
    [todayAttendance]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asistencias</h1>
          <p className="text-slate-500">
            {formatDate(new Date())} - {todayAttendance.length} asistencias registradas
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/80 px-4 py-2 rounded-lg border shadow-sm">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('es-AR', { weekday: 'long' })}
        </div>
      </div>

      {/* Group Filter */}
      {storeGroups.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700 shrink-0">
                <Filter className="w-4 h-4" />
                Filtrar por grupo:
              </span>
              <div className="flex gap-2">
                <Button
                  variant={selectedGrupo === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGrupo('')}
                  className={selectedGrupo === '' ? 'bg-gradient-to-r from-cyan-500 to-sky-600' : ''}
                >
                  Todos
                </Button>
                {storeGroups.map(group => (
                  <Button
                    key={group.id}
                    variant={selectedGrupo === group.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGrupo(group.id)}
                    style={selectedGrupo === group.id ? { backgroundColor: group.color } : {}}
                    className={selectedGrupo === group.id ? 'text-white' : ''}
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-slate-500">
              <Users className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium">No hay clientes</p>
              <p className="text-sm">
                {selectedGrupo 
                  ? `No hay clientes en el grupo seleccionado`
                  : 'Agrega clientes para registrar asistencias'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, index) => (
              <ClientAttendanceCard
                key={client.id}
                client={client}
                index={index}
                onMarkAttendance={handleAttendance}
                isMarking={markingAttendance === client.id}
                optimisticClassesUsed={optimisticUpdates[client.id]?.classesUsed ?? null}
                todayCount={getClientAttendanceToday(client.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Today's Attendance List */}
      {recentAttendance.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
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
