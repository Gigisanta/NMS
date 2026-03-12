'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Bell, Mail, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsMap {
  [key: string]: {
    value: string
    category: string
    description: string | null
  }
}

export function NotificationSettings() {
  const { data: session } = useSession()
  const isEmpleadora = session?.user?.role === 'EMPLEADORA'

  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    'notifications.paymentReminder': 'true',
    'notifications.paymentReminderDays': '3',
    'notifications.overdueNotification': 'true',
    'notifications.newClientAlert': 'false',
    'notifications.classReminder': 'false',
    'notifications.emailEnabled': 'false',
    'notifications.whatsappEnabled': 'false',
  })
  const [saving, setSaving] = useState(false)

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings?category=notifications')
      const result = await response.json()
      if (result.success && result.data) {
        const settings = result.data as SettingsMap
        const getSetting = (key: string) => settings[key]?.value || ''
        
        setFormData({
          'notifications.paymentReminder': getSetting('notifications.paymentReminder') || 'true',
          'notifications.paymentReminderDays': getSetting('notifications.paymentReminderDays') || '3',
          'notifications.overdueNotification': getSetting('notifications.overdueNotification') || 'true',
          'notifications.newClientAlert': getSetting('notifications.newClientAlert') || 'false',
          'notifications.classReminder': getSetting('notifications.classReminder') || 'false',
          'notifications.emailEnabled': getSetting('notifications.emailEnabled') || 'false',
          'notifications.whatsappEnabled': getSetting('notifications.whatsappEnabled') || 'false',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const updates = Object.entries(formData).map(([key, value]) => ({ key, value }))
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Configuración de notificaciones guardada')
      } else {
        toast.error(result.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }, [formData])

  const toggleSwitch = useCallback((key: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true',
    }))
  }, [])

  const updateField = useCallback((key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* General Notifications */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Bell className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Notificaciones del Sistema</CardTitle>
              <CardDescription>Configura qué alertas recibir</CardDescription>
            </div>
            {isEmpleadora && (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">Recordatorio de Pago</p>
                <p className="text-sm text-slate-500">Alertar antes del vencimiento mensual</p>
              </div>
              <Switch
                checked={formData['notifications.paymentReminder'] === 'true'}
                onCheckedChange={() => toggleSwitch('notifications.paymentReminder')}
                disabled={!isEmpleadora}
              />
            </div>
            
            {formData['notifications.paymentReminder'] === 'true' && (
              <div className="pl-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Días de anticipación:</Label>
                  <Input
                    type="number"
                    value={formData['notifications.paymentReminderDays']}
                    onChange={(e) => updateField('notifications.paymentReminderDays', e.target.value)}
                    disabled={!isEmpleadora}
                    className="w-20"
                    min="1"
                    max="30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Overdue Notification */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium">Notificación de Mora</p>
              <p className="text-sm text-slate-500">Alertar cuando un cliente tiene pagos vencidos</p>
            </div>
            <Switch
              checked={formData['notifications.overdueNotification'] === 'true'}
              onCheckedChange={() => toggleSwitch('notifications.overdueNotification')}
              disabled={!isEmpleadora}
            />
          </div>

          {/* New Client Alert */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium">Alerta de Nuevo Cliente</p>
              <p className="text-sm text-slate-500">Notificar cuando se registra un nuevo cliente</p>
            </div>
            <Switch
              checked={formData['notifications.newClientAlert'] === 'true'}
              onCheckedChange={() => toggleSwitch('notifications.newClientAlert')}
              disabled={!isEmpleadora}
            />
          </div>

          {/* Class Reminder */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium">Recordatorio de Clase</p>
              <p className="text-sm text-slate-500">Recordar a los clientes sus horarios de clase</p>
            </div>
            <Switch
              checked={formData['notifications.classReminder'] === 'true'}
              onCheckedChange={() => toggleSwitch('notifications.classReminder')}
              disabled={!isEmpleadora}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Canales de Notificación</CardTitle>
          <CardDescription>Selecciona cómo recibir las notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-slate-500">Recibir notificaciones por correo electrónico</p>
              </div>
            </div>
            <Switch
              checked={formData['notifications.emailEnabled'] === 'true'}
              onCheckedChange={() => toggleSwitch('notifications.emailEnabled')}
              disabled={!isEmpleadora}
            />
          </div>

          {/* WhatsApp */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-slate-500">Recibir notificaciones por WhatsApp</p>
              </div>
            </div>
            <Switch
              checked={formData['notifications.whatsappEnabled'] === 'true'}
              onCheckedChange={() => toggleSwitch('notifications.whatsappEnabled')}
              disabled={!isEmpleadora}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
