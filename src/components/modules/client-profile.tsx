'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Loader2, 
  Save, 
  X, 
  Calendar,
  Clock,
  Phone,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileCheck,
  Upload,
  CreditCard
} from 'lucide-react'
import { GroupBadge } from './group-badge'
import { GroupSelector } from './group-selector'
import { ScheduleSelector } from './schedule-selector'
import { InvoiceUpload } from './invoice-upload'
import { cn } from '@/lib/utils'
import { formatFullName, getPaymentStatusConfig, formatDate, formatTime } from '@/lib/utils'

interface Group {
  id: string
  name: string
  color: string
}

interface Subscription {
  id: string
  month: number
  year: number
  status: string
  classesTotal: number
  classesUsed: number
  amount: number | null
  notes: string | null
}

interface Attendance {
  id: string
  date: string
  notes: string | null
}

interface Invoice {
  id: string
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string
  invoiceNumber: string | null
  amount: number | null
  currency: string
  issueDate: string | null
  dueDate: string | null
  type: string
  category: string | null
  description: string | null
  verified: boolean
  status: string
  source: string
  uploadedAt: string
}

interface Client {
  id: string
  nombre: string
  apellido: string
  dni: string | null
  telefono: string
  grupoId: string | null
  grupo: Group | null
  preferredDays: string | null
  preferredTime: string | null
  notes: string | null
  registrationFeePaid1: boolean
  registrationFeePaid2: boolean
  subscriptions: Subscription[]
  attendances: Attendance[]
  invoices: Invoice[]
}

interface ClientProfileProps {
  clientId: string
  groups: Group[]
  onClose: () => void
  onSaved: () => void
}

// Memoized attendance item
const AttendanceItem = memo(function AttendanceItem({ attendance }: { attendance: Attendance }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium">
          {formatDate(attendance.date)}
        </span>
      </div>
      <span className="text-xs text-slate-500">
        {formatTime(attendance.date)}
      </span>
    </div>
  )
})

// Memoized subscription item
const SubscriptionItem = memo(function SubscriptionItem({ sub }: { sub: Subscription }) {
  const config = useMemo(() => getPaymentStatusConfig(sub.status), [sub.status])
  const monthLabel = useMemo(() => 
    new Date(sub.year, sub.month - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
    [sub.month, sub.year]
  )
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div>
        <p className="text-sm font-medium capitalize">{monthLabel}</p>
        <p className="text-xs text-slate-500">
          {sub.classesUsed}/{sub.classesTotal} clases
        </p>
      </div>
      <Badge className={cn(config.color, 'border', 'text-xs')}>
        {config.label}
      </Badge>
    </div>
  )
})

// Memoized tab button
const TabButton = memo(function TabButton({ 
  id, 
  label, 
  Icon, 
  active, 
  onClick 
}: { 
  id: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
        active
          ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
})

export function ClientProfile({ clientId, groups, onClose, onSaved }: ClientProfileProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    grupoId: '',
    preferredDays: '',
    preferredTime: '',
    notes: '',
    classesTotal: 4,
    amount: 0,
    registrationFeePaid1: false,
    registrationFeePaid2: false,
  })

  const [activeTab, setActiveTab] = useState<'info' | 'subscription' | 'inscription' | 'history' | 'invoices'>('info')

  // Memoized current date values
  const currentDate = useMemo(() => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  }, [])

  // Fetch client data
  const fetchClient = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const result = await response.json()
      if (result.success) {
        setClient(result.data)
        const currentSub = result.data.subscriptions?.find(
          (s: Subscription) => s.month === currentDate.month && s.year === currentDate.year
        )
        setFormData({
          nombre: result.data.nombre || '',
          apellido: result.data.apellido || '',
          dni: result.data.dni || '',
          telefono: result.data.telefono || '',
          grupoId: result.data.grupoId || '',
          preferredDays: result.data.preferredDays || '',
          preferredTime: result.data.preferredTime || '',
          notes: result.data.notes || '',
          classesTotal: currentSub?.classesTotal || 4,
          amount: currentSub?.amount || 0,
          registrationFeePaid1: result.data.registrationFeePaid1 || false,
          registrationFeePaid2: result.data.registrationFeePaid2 || false,
        })
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoading(false)
    }
  }, [clientId, currentDate.month, currentDate.year])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  // Memoized callbacks
  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)

    try {
      // Update client data
      const clientResponse = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
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
        }),
      })

      const clientResult = await clientResponse.json()

      if (!clientResult.success) {
        setError(clientResult.error || 'Error al guardar cliente')
        return
      }

      // Update subscription classes
      const subscription = client?.subscriptions?.find(
        s => s.month === currentDate.month && s.year === currentDate.year
      )

      if (subscription) {
        await fetch(`/api/subscriptions/${subscription.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classesTotal: formData.classesTotal,
            amount: formData.amount,
          }),
        })
      }

      onSaved()
    } catch (error) {
      console.error('Error saving client:', error)
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }, [clientId, formData, client?.subscriptions, currentDate, onSaved])

  // Memoized form field updaters
  const updateFormData = useCallback(<K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleScheduleChange = useCallback((days: string, time: string) => {
    setFormData(prev => ({ ...prev, preferredDays: days, preferredTime: time }))
  }, [])

  const decrementClasses = useCallback(() => {
    setFormData(prev => ({ ...prev, classesTotal: Math.max(1, prev.classesTotal - 1) }))
  }, [])

  const incrementClasses = useCallback(() => {
    setFormData(prev => ({ ...prev, classesTotal: prev.classesTotal + 1 }))
  }, [])

  // Memoized computed values
  const currentSubscription = useMemo(() => 
    client?.subscriptions?.find(
      s => s.month === currentDate.month && s.year === currentDate.year
    ),
    [client?.subscriptions, currentDate]
  )

  const statusConfig = useMemo(() => 
    currentSubscription 
      ? getPaymentStatusConfig(currentSubscription.status)
      : getPaymentStatusConfig('PENDIENTE'),
    [currentSubscription]
  )

  const clientFullName = useMemo(() => 
    client ? formatFullName(client.nombre, client.apellido) : '',
    [client]
  )

  const progressPercent = useMemo(() => 
    ((currentSubscription?.classesUsed || 0) / formData.classesTotal) * 100,
    [currentSubscription?.classesUsed, formData.classesTotal]
  )

  const classesAvailable = useMemo(() => 
    formData.classesTotal - (currentSubscription?.classesUsed || 0),
    [formData.classesTotal, currentSubscription?.classesUsed]
  )

  // Memoized attendance history
  const recentAttendances = useMemo(() => 
    client?.attendances?.slice(0, 10) || [],
    [client?.attendances]
  )

  // Memoized subscription history
  const subscriptionHistory = useMemo(() => 
    client?.subscriptions || [],
    [client?.subscriptions]
  )

  // Memoized invoices
  const clientInvoices = useMemo(() => 
    client?.invoices || [],
    [client?.invoices]
  )

  // Tab config (static)
  const tabs = useMemo(() => [
    { id: 'info' as const, label: 'Información', icon: User },
    { id: 'subscription' as const, label: 'Suscripción', icon: Calendar },
    { id: 'inscription' as const, label: 'Inscripción', icon: CreditCard },
    { id: 'invoices' as const, label: 'Facturas', icon: Receipt },
    { id: 'history' as const, label: 'Historial', icon: Clock },
  ], [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-slate-500">Cliente no encontrado</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white/50 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{clientFullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <GroupBadge group={client.grupo} size="sm" />
                <Badge className={cn(statusConfig.color, 'border')}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-sky-600"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              Icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Datos personales */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-600" />
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => updateFormData('nombre', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido</Label>
                    <Input
                      value={formData.apellido}
                      onChange={(e) => updateFormData('apellido', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      Teléfono
                    </Label>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => updateFormData('telefono', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DNI</Label>
                    <Input
                      value={formData.dni}
                      onChange={(e) => updateFormData('dni', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <GroupSelector
                    value={formData.grupoId}
                    onChange={(grupoId) => updateFormData('grupoId', grupoId || '')}
                    groups={groups}
                    onGroupsChange={() => {}}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Horario preferido */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  Horario Preferido
                </CardTitle>
                <CardDescription>
                  Selecciona los días y horarios en los que asistirá
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleSelector
                  preferredDays={formData.preferredDays}
                  preferredTime={formData.preferredTime}
                  onChange={handleScheduleChange}
                />
              </CardContent>
            </Card>

            {/* Notas */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  Notas y Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Agrega notas sobre el cliente, condiciones médicas, preferencias, etc."
                  className="min-h-[120px] resize-none"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Clases del mes actual */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  Clases de {new Date(currentDate.year, currentDate.month - 1).toLocaleDateString('es-AR', { month: 'long' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Monto mensual */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Monto mensual</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">$</span>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={formData.amount || ''}
                      onChange={(e) => updateFormData('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Clases contratadas</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={decrementClasses}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">
                      {formData.classesTotal}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={incrementClasses}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Clases usadas</span>
                  <span className="text-2xl font-bold text-slate-400">
                    {currentSubscription?.classesUsed || 0}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-sky-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{currentSubscription?.classesUsed || 0} usadas</span>
                    <span>{classesAvailable} disponibles</span>
                  </div>
                </div>

                {/* Estado de pago */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Estado de pago</span>
                    <Badge className={cn(statusConfig.color, 'border')}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'inscription' && (
          <div className="space-y-6">
            {/* Cuota 1 - Primera cuota de inscripción */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-600" />
                  Cuota 1 - Primera Inscripción
                </CardTitle>
                <CardDescription>
                  Primera cuota de inscripción ($25.000)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle for payment status */}
                <div className="flex items-center justify-between p-4 rounded-xl border" style={{ background: formData.registrationFeePaid1 ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)' }}>
                  <div className="flex items-center gap-3">
                    {formData.registrationFeePaid1 ? (
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Estado de pago</p>
                      <p className="text-xs text-slate-500">
                        {formData.registrationFeePaid1 ? 'Pagado' : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = !formData.registrationFeePaid1
                      setFormData(prev => ({ ...prev, registrationFeePaid1: newValue }))
                      // Save immediately
                      fetch(`/api/clients/${clientId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ registrationFeePaid1: newValue }),
                      })
                    }}
                    className={cn(
                      'relative inline-flex h-8 w-14 items-center rounded-full transition-all',
                      formData.registrationFeePaid1
                        ? 'bg-emerald-500'
                        : 'bg-amber-400'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-all',
                        formData.registrationFeePaid1 ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Upload receipt button */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium">Comprobante</p>
                      <p className="text-xs text-slate-500">
                        {clientInvoices.filter(inv => inv.category === 'INSCRIPCION_CUOTA1').length > 0 
                          ? 'Comprobante adjuntado'
                          : 'Sin comprobante'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Trigger file input for this specific cuota
                      const input = document.getElementById('inscription-receipt-1') as HTMLInputElement
                      if (input) input.click()
                    }}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {clientInvoices.filter(inv => inv.category === 'INSCRIPCION_CUOTA1').length > 0 ? 'Cambiar' : 'Subir'}
                  </Button>
                  <input
                    id="inscription-receipt-1"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      const formDataUpload = new FormData()
                      formDataUpload.append('file', file)
                      formDataUpload.append('clientId', clientId)
                      formDataUpload.append('type', 'RECEIPT')
                      formDataUpload.append('category', 'INSCRIPCION_CUOTA1')
                      formDataUpload.append('description', 'Comprobante cuota 1 inscripción')

                      try {
                        const response = await fetch('/api/invoices', {
                          method: 'POST',
                          body: formDataUpload,
                        })
                        const result = await response.json()
                        if (result.success) {
                          fetchClient()
                        }
                      } catch (error) {
                        console.error('Error uploading receipt:', error)
                      }
                    }}
                  />
                </div>

                {/* Show existing receipt if any */}
                {clientInvoices.filter(inv => inv.category === 'INSCRIPCION_CUOTA1').map(invoice => (
                  <div key={invoice.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{invoice.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(invoice.uploadedAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(invoice.filePath, '_blank')}
                    >
                      <Receipt className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cuota 2 - Segunda cuota de inscripción */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-600" />
                  Cuota 2 - Segunda Inscripción
                </CardTitle>
                <CardDescription>
                  Segunda cuota de inscripción ($25.000)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle for payment status */}
                <div className="flex items-center justify-between p-4 rounded-xl border" style={{ background: formData.registrationFeePaid2 ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)' }}>
                  <div className="flex items-center gap-3">
                    {formData.registrationFeePaid2 ? (
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Estado de pago</p>
                      <p className="text-xs text-slate-500">
                        {formData.registrationFeePaid2 ? 'Pagado' : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = !formData.registrationFeePaid2
                      setFormData(prev => ({ ...prev, registrationFeePaid2: newValue }))
                      // Save immediately
                      fetch(`/api/clients/${clientId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ registrationFeePaid2: newValue }),
                      })
                    }}
                    className={cn(
                      'relative inline-flex h-8 w-14 items-center rounded-full transition-all',
                      formData.registrationFeePaid2
                        ? 'bg-emerald-500'
                        : 'bg-amber-400'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-all',
                        formData.registrationFeePaid2 ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Upload receipt button */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium">Comprobante</p>
                      <p className="text-xs text-slate-500">
                        {clientInvoices.filter(inv => inv.category === 'INSCRIPCION_CUOTA2').length > 0 
                          ? 'Comprobante adjuntado'
                          : 'Sin comprobante'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Trigger file input for this specific cuota
                      const input = document.getElementById('inscription-receipt-2') as HTMLInputElement
                      if (input) input.click()
                    }}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {clientInvoices.filter(inv => inv.category === 'INSCRIPCION_CUOTA2').length > 0 ? 'Cambiar' : 'Subir'}
                  </Button>
                  <input
                    id="inscription-receipt-2"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      const formDataUpload = new FormData()
                      formDataUpload.append('file', file)
                      formDataUpload.append('clientId', clientId)
                      formDataUpload.append('type', 'RECEIPT')
                      formDataUpload.append('category', 'INSCRIPCION_CUOTA2')
                      formDataUpload.append('description', 'Comprobante cuota 2 inscripción')

                      try {
                        const response = await fetch('/api/invoices', {
                          method: 'POST',
                          body: formDataUpload,
                        })
                        const result = await response.json()
                        if (result.success) {
                          fetchClient()
                        }
                      } catch (error) {
                        console.error('Error uploading receipt:', error)
                      }
                    }}
                  />
                </div>

                {/* Show existing receipt if any */}
                {clientInvoices.filter(inv => inv.category === 'INSCRIPCION_CUOTA2').map(invoice => (
                  <div key={invoice.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{invoice.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(invoice.uploadedAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(invoice.filePath, '_blank')}
                    >
                      <Receipt className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <InvoiceUpload
              clientId={client.id}
              invoices={clientInvoices}
              onInvoiceChange={fetchClient}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Historial de asistencias */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  Últimas Asistencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentAttendances.length > 0 ? (
                  <div className="space-y-2">
                    {recentAttendances.map((attendance) => (
                      <AttendanceItem key={attendance.id} attendance={attendance} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Sin asistencias registradas
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Historial de suscripciones */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  Historial de Suscripciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {subscriptionHistory.map((sub) => (
                      <SubscriptionItem key={sub.id} sub={sub} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Sin suscripciones registradas
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
