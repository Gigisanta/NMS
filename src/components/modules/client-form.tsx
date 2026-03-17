'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Check, Calendar, Clock, FileText, User, Phone, Hash, DollarSign } from 'lucide-react'
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
  monthlyAmount: number | null
  registrationPaid: boolean
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
    monthlyAmount: client?.monthlyAmount || null,
    registrationPaid: client?.registrationPaid || false,
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
          monthlyAmount: formData.monthlyAmount,
          registrationPaid: formData.registrationPaid,
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
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0, 168, 232, 0.1)' }}>
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id as typeof activeSection)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                activeSection === section.id
                  ? 'shadow-sm text-white'
                  : 'text-[#4A5568] hover:bg-white/50'
              )}
              style={activeSection === section.id ? {
                background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)',
              } : {}}
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
                  className="transition-all"
                  style={{ borderColor: 'rgba(0, 168, 232, 0.3)' }}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  placeholder="Pérez"
                  required
                  className="transition-all"
                  style={{ borderColor: 'rgba(0, 168, 232, 0.3)' }}
                />
              </div>
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
                className="transition-all"
                style={{ borderColor: 'rgba(0, 168, 232, 0.3)' }}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-3 h-3" style={{ color: '#00A8E8' }} />
                Teléfono *
              </Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="3512345678"
                required
                className="transition-all"
                style={{ borderColor: 'rgba(0, 168, 232, 0.3)' }}
              />
              <p className="text-xs" style={{ color: '#86868b' }}>
                Número sin espacios ni guiones
              </p>
            </div>

            <div className="space-y-2">
              <Label>Grupo</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, grupoId: '' })}
                  className={cn(
                    'px-3 py-2 text-sm rounded-xl border-2 transition-all',
                    !formData.grupoId
                      ? 'border-[#00A8E8] text-[#005691]'
                      : 'border-[rgba(0,168,232,0.2)] hover:border-[rgba(0,168,232,0.4)]'
                  )}
                  style={!formData.grupoId ? {
                    background: 'rgba(0, 168, 232, 0.1)',
                  } : {}}
                >
                  Sin grupo
                </button>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, grupoId: group.id })}
                    className={cn(
                      'px-3 py-2 text-sm rounded-xl border-2 transition-all',
                      formData.grupoId === group.id
                        ? 'shadow-md'
                        : 'border-[rgba(0,168,232,0.2)] hover:border-[rgba(0,168,232,0.4)]'
                    )}
                    style={formData.grupoId === group.id ? {
                      backgroundColor: `${group.color}15`,
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
                <FileText className="w-3 h-3" style={{ color: '#00A8E8' }} />
                Notas
              </Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas sobre el cliente..."
                className="min-h-[80px] resize-none transition-all"
                style={{ borderColor: 'rgba(0, 168, 232, 0.3)' }}
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
            {/* Monthly Amount */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-3 h-3" style={{ color: '#00A8E8' }} />
                Monto Mensual del Plan *
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium" style={{ color: '#1A1A1A' }}>$</span>
                <Input
                  type="number"
                  value={formData.monthlyAmount || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    monthlyAmount: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  placeholder="0.00"
                  required
                  className="text-lg font-semibold transition-all h-12"
                  style={{ borderColor: 'rgba(0, 168, 232, 0.3)' }}
                />
              </div>
              <p className="text-xs" style={{ color: '#86868b' }}>
                Monto que el cliente debe pagar cada mes.
              </p>
            </div>

            {/* Registration Paid Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border" style={{ background: 'rgba(0, 168, 232, 0.05)' }}>
              <div>
                <Label className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Inscripción Pagada</Label>
                <p className="text-xs" style={{ color: '#86868b' }}>
                  Indica si el cliente ya pagó la inscripción
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  registrationPaid: !formData.registrationPaid 
                })}
                className={cn(
                  'relative inline-flex h-8 w-14 items-center rounded-full transition-all',
                  formData.registrationPaid 
                    ? 'bg-[#34C759]' 
                    : 'bg-[rgba(0,168,232,0.3)]'
                )}
              >
                <span 
                  className={cn(
                    'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-all',
                    formData.registrationPaid ? 'translate-x-7' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Hash className="w-3 h-3" style={{ color: '#00A8E8' }} />
                Clases contratadas
              </Label>
              <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-[rgba(0,168,232,0.1)]">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-2"
                  style={{ borderColor: 'rgba(0, 168, 232, 0.3)', color: '#005691' }}
                  onClick={() => setFormData({ ...formData, classesTotal: Math.max(1, formData.classesTotal - 1) })}
                >
                  <span className="text-lg">−</span>
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-[#005691]">{formData.classesTotal}</span>
                  <span className="text-sm text-slate-500 ml-2">clases/mes</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-2"
                  style={{ borderColor: 'rgba(0, 168, 232, 0.3)', color: '#005691' }}
                  onClick={() => setFormData({ ...formData, classesTotal: Math.min(30, formData.classesTotal + 1) })}
                >
                  <span className="text-lg">+</span>
                </Button>
              </div>
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

        <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid rgba(0, 168, 232, 0.1)' }}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-full"
            style={{ 
              borderColor: 'rgba(0, 168, 232, 0.3)',
              color: '#005691'
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-full text-white"
            style={{
              background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)',
              boxShadow: '0 4px 15px rgba(0, 168, 232, 0.3)',
            }}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {client?.id ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
    </form>
  )
}
