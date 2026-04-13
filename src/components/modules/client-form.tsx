'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, Calendar, Clock, FileText, User, Phone, Hash, DollarSign, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn, parseArsAmount } from '@/lib/utils'
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
  telefono: string | null
  grupoId: string | null
  preferredDays: string | null
  preferredTime: string | null
  notes: string | null
  monthlyAmount: number | null
  registrationFeePaid1: boolean
  registrationFeePaid2: boolean
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
  const [additionalGroups, setAdditionalGroups] = useState<string[]>([])

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
    billingPeriod: 'FULL' as 'FULL' | 'HALF',
    monthlyAmount: client?.monthlyAmount || null,
    registrationFeePaid1: client?.registrationFeePaid1 || false,
    registrationFeePaid2: client?.registrationFeePaid2 || false,
  })

  const sections = [
    { id: 'personal', label: 'Datos', icon: User },
    { id: 'schedule', label: 'Horario', icon: Clock },
    { id: 'subscription', label: 'Plan', icon: Calendar },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = client?.id ? `/api/clients/${client.id}` : '/api/clients'
      const response = await fetch(url, {
        method: client?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          dni: formData.dni || null,
          telefono: formData.telefono || null,
          grupoId: formData.grupoId || null,
          preferredDays: formData.preferredDays || null,
          preferredTime: formData.preferredTime || null,
          notes: formData.notes || null,
          classesTotal: formData.classesTotal,
          billingPeriod: formData.billingPeriod,
          monthlyAmount: formData.monthlyAmount,
          registrationFeePaid1: formData.registrationFeePaid1,
          registrationFeePaid2: formData.registrationFeePaid2,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (!client?.id && additionalGroups.length > 0) {
          const clientId = result.data.id
          const results = await Promise.all(
            additionalGroups.map(groupId =>
              fetch('/api/client-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, groupId }),
              })
            )
          )
          const failedGroups = results.filter(r => !r.ok)
          if (failedGroups.length > 0) {
            toast.error(`Error al asignar ${failedGroups.length} grupo(s)`)
          }
        }
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

  const toggleAdditionalGroup = (groupId: string) => {
    setAdditionalGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                activeSection === section.id ? 'shadow-sm text-white' : 'text-[#4A5568] hover:bg-white/50'
              )}
              style={activeSection === section.id ? {
                background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)',
              } : {}}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content — no fixed height, outer card handles scrolling */}
      <div className="min-h-0">
        {activeSection === 'personal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-slate-400" />
                  DNI
                </Label>
                <Input
                  value={formData.dni || ''}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-3 h-3" style={{ color: '#00A8E8' }} />
                  Teléfono
                </Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="3512345678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Grupo Principal</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, grupoId: '' })}
                  className={cn(
                    'px-3 py-2 text-sm rounded-xl border-2 transition-all',
                    !formData.grupoId
                      ? 'border-[#00A8E8] text-[#005691] bg-[rgba(0,168,232,0.1)]'
                      : 'border-[rgba(0,168,232,0.2)] hover:border-[rgba(0,168,232,0.4)]'
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
                      'px-3 py-2 text-sm rounded-xl border-2 transition-all',
                      formData.grupoId === group.id ? 'shadow-md' : 'border-[rgba(0,168,232,0.2)] hover:border-[rgba(0,168,232,0.4)]'
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

            {!client?.id && groups.filter(g => g.id !== formData.grupoId).length > 0 && (
              <div className="space-y-2">
                <Label>Grupos Adicionales</Label>
                <p className="text-xs text-slate-500">Para clientes que asisten a más de un horario</p>
                <div className="flex flex-wrap gap-2">
                  {groups
                    .filter(group => group.id !== formData.grupoId)
                    .map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleAdditionalGroup(group.id)}
                        className={cn(
                          'px-3 py-2 text-sm rounded-xl border-2 transition-all',
                          additionalGroups.includes(group.id) ? 'shadow-md' : 'border-[rgba(0,168,232,0.2)] hover:border-[rgba(0,168,232,0.4)]'
                        )}
                        style={additionalGroups.includes(group.id) ? {
                          backgroundColor: `${group.color}15`,
                          borderColor: group.color,
                          color: group.color,
                        } : {}}
                      >
                        {additionalGroups.includes(group.id) && <Check className="w-3 h-3 inline mr-1" />}
                        {group.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-3 h-3" style={{ color: '#00A8E8' }} />
                Notas
              </Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas sobre el cliente..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}

        {activeSection === 'schedule' && (
          <ScheduleSelector
            preferredDays={formData.preferredDays}
            preferredTime={formData.preferredTime}
            onChange={(days, time) => setFormData({ ...formData, preferredDays: days, preferredTime: time })}
          />
        )}

        {activeSection === 'subscription' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-3 h-3" style={{ color: '#00A8E8' }} />
                Monto Mensual *
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-slate-700">$</span>
                <Input
                  type="number"
                  value={formData.monthlyAmount || ''}
                  onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value ? parseArsAmount(e.target.value) : null })}
                  placeholder="0.00"
                  required
                  className="text-lg font-semibold h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-3 h-3" style={{ color: '#00A8E8' }} />
                Periodo de Facturación
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billingPeriod: 'FULL' })}
                  className={cn(
                    'py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium',
                    formData.billingPeriod === 'FULL'
                      ? 'border-[#00A8E8] text-[#005691] bg-[rgba(0,168,232,0.1)]'
                      : 'border-[rgba(0,168,232,0.2)] text-slate-600 hover:border-[rgba(0,168,232,0.4)]'
                  )}
                >
                  Mes completo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billingPeriod: 'HALF' })}
                  className={cn(
                    'py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium',
                    formData.billingPeriod === 'HALF'
                      ? 'border-[#00A8E8] text-[#005691] bg-[rgba(0,168,232,0.1)]'
                      : 'border-[rgba(0,168,232,0.2)] text-slate-600 hover:border-[rgba(0,168,232,0.4)]'
                  )}
                >
                  1/2 mes
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Hash className="w-3 h-3" style={{ color: '#00A8E8' }} />
                Clases contratadas
              </Label>
              <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-[rgba(0,168,232,0.15)]">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-2 shrink-0"
                  style={{ borderColor: 'rgba(0, 168, 232, 0.3)', color: '#005691' }}
                  onClick={() => setFormData({ ...formData, classesTotal: Math.max(1, formData.classesTotal - 1) })}
                >
                  <span className="text-lg leading-none">−</span>
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-semibold text-[#005691]">{formData.classesTotal}</span>
                  <span className="text-sm text-slate-500 ml-2">clases/mes</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-2 shrink-0"
                  style={{ borderColor: 'rgba(0, 168, 232, 0.3)', color: '#005691' }}
                  onClick={() => setFormData({ ...formData, classesTotal: Math.min(30, formData.classesTotal + 1) })}
                >
                  <span className="text-lg leading-none">+</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Cuotas de Inscripción</Label>
              {[
                { key: 'registrationFeePaid1' as const, label: 'Cuota 1' },
                { key: 'registrationFeePaid2' as const, label: 'Cuota 2' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: 'rgba(0, 168, 232, 0.05)' }}>
                  <div>
                    <p className="text-sm font-medium">{label} — Inscripción ($25.000)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, [key]: !formData[key] })}
                    className={cn(
                      'relative inline-flex h-7 w-12 items-center rounded-full transition-all shrink-0',
                      formData[key] ? 'bg-[#34C759]' : 'bg-[rgba(0,168,232,0.3)]'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all',
                      formData[key] ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700">
                <Calendar className="w-3 h-3 inline mr-1" />
                Se creará una suscripción pendiente para el mes actual
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t border-slate-100">
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
          className="flex-1 text-white"
          style={{ background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)' }}
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {client?.id ? 'Guardar Cambios' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  )
}
