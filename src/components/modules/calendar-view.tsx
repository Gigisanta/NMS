'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, StickyNote, Trash2, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start: string
  end: string | null
  allDay: boolean
  color: string | null
  userId: string | null
}

export function CalendarView() {
  const { data: session } = useSession()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventForm, setShowEventForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    allDay: true,
    color: '#3b82f6'
  })

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const start = startOfMonth(currentMonth).toISOString()
      const end = endOfMonth(currentMonth).toISOString()
      const response = await fetch(`/api/calendar?start=${start}&end=${end}`)
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setEvents(result.data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    })
  }, [currentMonth])

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return events.filter(event => isSameDay(new Date(event.start), selectedDate))
  }, [events, selectedDate])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !formData.title) return

    setSaving(true)
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start: selectedDate.toISOString(),
          userId: session?.user?.id
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        toast.success('Evento creado correctamente')
        setShowEventForm(false)
        setFormData({ title: '', description: '', allDay: true, color: '#3b82f6' })
        fetchEvents()
      } else {
        toast.error(result.error || 'Error al crear evento')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error(error instanceof Error ? error.message : 'Error de conexión al crear evento')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/calendar?id=${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== id))
        toast.success('Evento eliminado')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error(error instanceof Error ? error.message : 'Error de conexión al eliminar evento')
    } finally {
      setDeletingEventId(null)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
      {/* Sidebar: Calendar & Date picker */}
      <div className="w-full lg:w-80 space-y-4 sm:space-y-6 shrink-0">
        <Card className="border-slate-100 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Calendario Global
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex justify-center">
            <CalendarUI
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="rounded-md"
              disabled={loading}
              modifiers={{
                hasEvent: (date) => events.some(e => isSameDay(new Date(e.start), date))
              }}
              modifiersClassNames={{
                hasEvent: "after:content-[''] after:w-1 after:h-1 after:bg-blue-500 after:rounded-full after:absolute after:bottom-1"
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card className="border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Eventos</CardTitle>
              <p className="text-xs text-slate-500">
                {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
              </p>
            </div>
            <Button
              size="icon"
              className="rounded-full h-8 w-8"
              style={{ background: '#005691' }}
              onClick={() => setShowEventForm(true)}
              disabled={!selectedDate}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {eventsForSelectedDate.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      <StickyNote className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400">Sin eventos para este día</p>
                  </div>
                ) : (
                  eventsForSelectedDate.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group p-3 rounded-lg border-l-4 bg-slate-50 relative"
                      style={{ borderLeftColor: event.color || '#3b82f6' }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-semibold text-slate-800 pr-6">
                          {event.title}
                        </h4>
                        <button
                          onClick={() => setDeletingEventId(event.id)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-2 top-2 p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {event.description || 'Sin notas.'}
                      </p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Main Content: Full Month View */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="border-slate-100 shadow-sm flex flex-col flex-1 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 px-6 pt-6">
            <div className="flex items-center gap-4">
              <CalendarIcon className="w-5 h-5" style={{ color: '#00A8E8' }} />
              <h2 className="text-lg font-semibold text-slate-900 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-2 h-8"
                onClick={() => setCurrentMonth(new Date())}
              >
                Hoy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-auto">
            <div className="grid grid-cols-7 border-b text-center py-2 bg-slate-50/50">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {day}
                </span>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr min-h-[400px] sm:min-h-[600px]">
              {/* Fill initial empty days */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b border-slate-100 bg-slate-50/20" />
              ))}

              {days.map((day, i) => {
                const dayEvents = events.filter(e => isSameDay(new Date(e.start), day))
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                const handleDayKeyDown = (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedDate(day)
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault()
                    if (i < days.length - 1) {
                      setSelectedDate(days[i + 1])
                      setFocusedDayIndex(i + 1)
                    }
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault()
                    if (i > 0) {
                      setSelectedDate(days[i - 1])
                      setFocusedDayIndex(i - 1)
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    const nextWeek = i + 7
                    if (nextWeek < days.length) {
                      setSelectedDate(days[nextWeek])
                      setFocusedDayIndex(nextWeek)
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    const prevWeek = i - 7
                    if (prevWeek >= 0) {
                      setSelectedDate(days[prevWeek])
                      setFocusedDayIndex(prevWeek)
                    }
                  }
                }

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    onKeyDown={handleDayKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-label={`${format(day, 'd MMMM')}${dayEvents.length > 0 ? `, ${dayEvents.length} eventos` : ''}`}
                    className={`border-r border-b border-slate-100 p-1 min-h-[100px] transition-colors duration-150 cursor-pointer hover:bg-[rgba(0,168,232,0.04)] focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:z-10 ${
                      isSelected ? 'bg-[rgba(0,168,232,0.08)]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full"
                        style={isToday ? { background: '#005691', color: 'white' } : { color: '#475569' }}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="text-[10px] px-1.5 py-0.5 rounded truncate text-white font-medium shadow-sm"
                          style={{ backgroundColor: event.color || '#3b82f6' }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-slate-400 px-1 font-medium">
                          + {dayEvents.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Dialog */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir Evento / Notita</DialogTitle>
            <DialogDescription>
              Deja un aviso o evento para que todos lo vean.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título / Aviso</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Mantenimiento pileta"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Notas / Detalles</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Escribe más detalles aquí..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Color de etiqueta</Label>
                <div className="flex gap-2">
                  {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#6366f1'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        formData.color === color ? 'scale-125 border-slate-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowEventForm(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                style={{ background: '#005691' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Evento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEventId} onOpenChange={(open) => !open && setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deletingEventId && handleDeleteEvent(deletingEventId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
