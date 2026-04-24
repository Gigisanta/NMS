'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock,
  LogIn,
  LogOut,
  Timer,
  Loader2,
  Calendar,
  Briefcase,
} from 'lucide-react'
import { formatTime, formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

// Types
interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  notes: string | null
}

interface Status {
  isWorking: boolean
  currentEntry: TimeEntry | null
  todayEntries: TimeEntry[]
  todayHours: number
  monthHours: number
  employeeRole: string | null
}

// Live timer component
const LiveTimer = memo(function LiveTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60

  return (
    <div className="font-mono text-3xl text-slate-900">
      {String(hours).padStart(2, '0')}:
      {String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </div>
  )
})

// Time Entry Item
const TimeEntryItem = memo(function TimeEntryItem({ 
  entry,
  index,
}: { 
  entry: TimeEntry
  index: number
}) {
  const clockIn = new Date(entry.clockIn)
  const clockOut = entry.clockOut ? new Date(entry.clockOut) : null

  const duration = useMemo(() => {
    if (!clockOut) return null
    const diff = clockOut.getTime() - clockIn.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }, [clockIn, clockOut])

  return (
    <motion.div 
      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium">
          {formatTime(clockIn)}
          {clockOut && ` - ${formatTime(clockOut)}`}
        </span>
      </div>
      {duration && (
        <Badge variant="secondary" className="font-mono">
          {duration}
        </Badge>
      )}
    </motion.div>
  )
})

export function TimeClockWidget() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      // Optimization: Fetch consolidated summary from server in a single request
      const response = await fetch('/api/time-entries?summary=true')
      const result = await response.json()
      
      if (result.success) {
        const { activeEntry, todayEntries, todayHours, monthHours } = result.data

        setStatus({
          isWorking: !!activeEntry,
          currentEntry: activeEntry || null,
          todayEntries: todayEntries || [],
          todayHours: todayHours || 0,
          monthHours: monthHours || 0,
          employeeRole: null,
        })
      }
    } catch (error) {
      console.error('Error fetching time status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus()
  }, [fetchStatus])

  const handleClockIn = useCallback(async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clock-in' }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        fetchStatus()
      } else {
        toast.error(result.error || 'Error al fichar entrada')
      }
    } catch (error) {
      toast.error('Error al fichar entrada')
    } finally {
      setProcessing(false)
    }
  }, [fetchStatus])

  const handleClockOut = useCallback(async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clock-out' }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        fetchStatus()
      } else {
        toast.error(result.error || 'Error al fichar salida')
      }
    } catch (error) {
      toast.error('Error al fichar salida')
    } finally {
      setProcessing(false)
    }
  }, [fetchStatus])

  const todayHoursDisplay = useMemo(() => {
    if (!status) return '0h 0min'
    const hours = Math.floor(status.todayHours)
    const minutes = Math.round((status.todayHours - hours) * 60)
    return `${hours}h ${minutes}min`
  }, [status])

  const monthHoursDisplay = useMemo(() => {
    if (!status) return '0h'
    return `${Math.round(status.monthHours * 10) / 10}h`
  }, [status])

  if (loading) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-secondary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Timer className="w-4 h-4 text-secondary" />
          Fichaje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Estado</span>
          {status?.isWorking ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-600">Trabajando</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full" />
              <span className="text-sm font-medium text-slate-500">Fuera de horario</span>
            </div>
          )}
        </div>

        {/* Timer or Clock Button */}
        {status?.isWorking && status.currentEntry ? (
          <motion.div 
            className="text-center py-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-xs text-slate-500 mb-2">Tiempo trabajado</p>
            <LiveTimer startTime={new Date(status.currentEntry.clockIn)} />
            <p className="text-xs text-slate-400 mt-2">
              Iniciado a las {formatTime(status.currentEntry.clockIn)}
            </p>
          </motion.div>
        ) : (
          <div className="text-center py-4">
            <div className="p-3 bg-slate-100 rounded-full inline-block mb-2">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">Listo para fichar</p>
          </div>
        )}

        {/* Clock In/Out Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={status?.isWorking ? handleClockOut : handleClockIn}
            disabled={processing}
            className="w-full h-12 text-base font-semibold gap-2 text-white"
            style={{ background: status?.isWorking ? 'var(--destructive)' : 'var(--primary)' }}
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : status?.isWorking ? (
              <>
                <LogOut className="w-5 h-5" />
                Fichar Salida
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Fichar Entrada
              </>
            )}
          </Button>
        </motion.div>

        {/* Today's Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-slate-500">Hoy</p>
            <p className="text-lg font-semibold text-slate-900">{todayHoursDisplay}</p>
            <p className="text-xs text-slate-400">{status?.todayEntries.length || 0} fichajes</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Este mes</p>
            <p className="text-lg font-semibold text-slate-900">{monthHoursDisplay}</p>
          </div>
        </div>

        {/* Recent entries */}
        {status?.todayEntries && status.todayEntries.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-slate-500 mb-2">Fichajes de hoy</p>
            <ScrollArea className="h-24">
              <div className="space-y-1">
                {status.todayEntries.slice(0, 5).map((entry, index) => (
                  <TimeEntryItem key={entry.id} entry={entry} index={index} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TimeClockWidget
