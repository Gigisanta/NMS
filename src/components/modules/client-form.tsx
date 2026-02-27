'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Check, Calendar, Clock, FileText, User, Phone, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScheduleSelector } from './schedule-selector'

interface Group {
  id: string
  name: string
  color: string
}

interface Client {
  id?: string
  nombre: string
  apellido: string
  dni: string | null
  telefono: string
  grupoId: string | null
  preferredDays: string | null
  preferredTime: string | null
  notes: string | null
}

interface ClientFormProps {
  client?: Client | null
  groups?: Group[]
  onSuccess: () => void
  onCancel: () => void
}

export function ClientForm({ client, groups = [], onSuccess, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'personal' | 'schedule' | 'subscription'>('personal')
  
  const [formData, setFormData] = useState({
    nombre: client?.nombre || '',
    apellido: client?.apellido || '',
    dni: client?.dni || '',
    telefono: client?.telefono || '',
    grupoId: client?.grupoId || '',
    preferredDays: client?.preferredDays || '',
    preferredTime: client?.preferredTime || '',
    notes: client?.notes || '',
    classesTotal: 4,
  })

  const sections = [
    { id: 'personal', label: 'Datos Personales', icon: User },
    { id: 'schedule', label: 'Horario', icon: Clock },
    { id: 'subscription', label: 'Suscripción', icon: Calendar },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = client?.id 
        ? `/api/clients/${client.id}` 
        : '/api/clients'
      
      const response = await fetch(url, {
        method: client?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          dni: formData.dni || null,
          telefono: formData.telefono,
          grupoId: formData.grupoId || null,
          preferredDays: formData.preferredDays || null,
          preferredTime: formData.preferredTime || null,
          notes: formData.notes || null,
          classesTotal: formData.classesTotal,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Error al guardar cliente')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error saving client:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id as typeof activeSection)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all',
                activeSection === section.id
                  ? 'bg-white text-cyan-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          )
        })}
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {/* Personal Info Section */}
        {activeSection === 'personal' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-3 h-3 text-slate-400" />
                  Nombre *
                </Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Juan"
                  required
                  className="transition-all focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  placeholder="Pérez"
                  required
                  className="transition-all focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-slate-400" />
                Teléfono *
              </Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="3512345678"
                required
                className="transition-all focus:ring-2 focus:ring-cyan-500/50"
              />
              <p className="text-xs text-slate-500">
                Número sin espacios ni guiones
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="w-3 h-3 text-slate-400" />
                DNI
              </Label>
              <Input
                value={formData.dni || ''}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                placeholder="12345678"
                className="transition-all focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Grupo</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, grupoId: '' })}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg border-2 transition-all',
                    !formData.grupoId
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  Sin grupo
                </button>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, grupoId: group.id })}
                    className={cn(
                      'px-3 py-2 text-sm rounded-lg border-2 transition-all',
                      formData.grupoId === group.id
                        ? 'border-transparent shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                    style={formData.grupoId === group.id ? {
                      backgroundColor: `${group.color}20`,
                      borderColor: group.color,
                      color: group.color,
                    } : {}}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-slate-400" />
                Notas
              </Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas sobre el cliente..."
                className="min-h-[80px] resize-none transition-all focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>
        )}

        {/* Schedule Section */}
        {activeSection === 'schedule' && (
          <div className="pt-2">
            <ScheduleSelector
              preferredDays={formData.preferredDays}
              preferredTime={formData.preferredTime}
              onChange={(days, time) => setFormData({
                ...formData,
                preferredDays: days,
                preferredTime: time
              })}
            />
          </div>
        )}

        {/* Subscription Section */}
        {activeSection === 'subscription' && (
          <div className="space-y-6 pt-2">
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Label className="text-base font-medium">Clases contratadas este mes</Label>
                  
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full border-2 hover:bg-cyan-50 hover:border-cyan-300"
                      onClick={() => setFormData({ 
                        ...formData, 
                        classesTotal: Math.max(1, formData.classesTotal - 1) 
                      })}
                    >
                      <span className="text-xl">−</span>
                    </Button>
                    
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                      <span className="text-4xl font-bold text-white">
                        {formData.classesTotal}
                      </span>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full border-2 hover:bg-cyan-50 hover:border-cyan-300"
                      onClick={() => setFormData({ 
                        ...formData, 
                        classesTotal: Math.min(30, formData.classesTotal + 1) 
                      })}
                    >
                      <span className="text-xl">+</span>
                    </Button>
                  </div>

                  <p className="text-sm text-slate-500">
                    {formData.classesTotal} clase{formData.classesTotal !== 1 ? 's' : ''} por mes
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 flex-wrap justify-center">
              {[1, 2, 4, 8, 12].map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant={formData.classesTotal === num ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, classesTotal: num })}
                  className={formData.classesTotal === num ? 'bg-gradient-to-r from-cyan-500 to-sky-600' : ''}
                >
                  {num} clases
                </Button>
              ))}
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700">
                <Calendar className="w-3 h-3 inline mr-1" />
                {client?.id 
                  ? 'Se actualizará la suscripción del mes actual'
                  : 'Se creará una suscripción pendiente para el mes actual'
                }
              </p>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 transition-all"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {client?.id ? 'Guardar Cambios' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  )
}
