'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, DollarSign, Plus, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PricingPlan {
  id: string
  name: string
  classes: number
  price: number
  currency: string
  description: string | null
  isDefault: boolean
  active: boolean
}

interface SettingsMap {
  [key: string]: {
    value: string
    category: string
    description: string | null
  }
}

export function PaymentSettings() {
  const { data: session } = useSession()
  const isEmpleadora = session?.user?.role === 'EMPLEADORA'

  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    'payment.defaultClasses': '4',
    'payment.defaultPrice': '0',
    'payment.dueDay': '10',
    'payment.lateFee': '0',
    'payment.autoStatus': 'true',
  })
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [newPlan, setNewPlan] = useState({ name: '', classes: '', price: '' })
  const [currency, setCurrency] = useState('ARS')

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings?category=payment')
      const result = await response.json()
      if (result.success && result.data) {
        const settings = result.data as SettingsMap
        const getSetting = (key: string) => settings[key]?.value || ''
        
        setFormData({
          'payment.defaultClasses': getSetting('payment.defaultClasses') || '4',
          'payment.defaultPrice': getSetting('payment.defaultPrice') || '0',
          'payment.dueDay': getSetting('payment.dueDay') || '10',
          'payment.lateFee': getSetting('payment.lateFee') || '0',
          'payment.autoStatus': getSetting('payment.autoStatus') || 'true',
        })
      }
      
      // Also fetch business currency
      const businessResponse = await fetch('/api/settings?category=business')
      const businessResult = await businessResponse.json()
      if (businessResult.success && businessResult.data) {
        const businessSettings = businessResult.data as SettingsMap
        setCurrency(businessSettings['business.currency']?.value || 'ARS')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch pricing plans
  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true)
    try {
      const response = await fetch('/api/pricing-plans')
      const result = await response.json()
      if (result.success) {
        setPlans(result.data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoadingPlans(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchPlans()
  }, [fetchSettings, fetchPlans])

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
        toast.success('Configuración de pagos guardada')
      } else {
        toast.error(result.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }, [formData])

  const updateField = useCallback((key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleAddPlan = useCallback(async () => {
    if (!newPlan.name || !newPlan.classes || !newPlan.price) {
      toast.error('Completa todos los campos del plan')
      return
    }

    try {
      const response = await fetch('/api/pricing-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlan.name,
          classes: parseInt(newPlan.classes),
          price: parseFloat(newPlan.price),
          currency,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setPlans(prev => [...prev, result.data])
        setNewPlan({ name: '', classes: '', price: '' })
        toast.success('Plan agregado')
      } else {
        toast.error(result.error || 'Error al agregar plan')
      }
    } catch (error) {
      toast.error('Error al agregar plan')
    }
  }, [newPlan, currency])

  const handleDeletePlan = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/pricing-plans?id=${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        setPlans(prev => prev.filter(p => p.id !== id))
        toast.success('Plan eliminado')
      }
    } catch (error) {
      toast.error('Error al eliminar plan')
    }
  }, [])

  const handleSetDefault = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/pricing-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      })

      const result = await response.json()
      if (result.success) {
        setPlans(prev => prev.map(p => ({ ...p, isDefault: p.id === id })))
        toast.success('Plan establecido como predeterminado')
      }
    } catch (error) {
      toast.error('Error al actualizar plan')
    }
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
      {/* General Payment Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Configuración de Pagos</CardTitle>
              <CardDescription>Ajustes generales de cobros y suscripciones</CardDescription>
            </div>
            {isEmpleadora && (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Clases por Defecto (por mes)</Label>
              <Input
                type="number"
                value={formData['payment.defaultClasses']}
                onChange={(e) => updateField('payment.defaultClasses', e.target.value)}
                disabled={!isEmpleadora}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Precio por Defecto</Label>
              <Input
                type="number"
                value={formData['payment.defaultPrice']}
                onChange={(e) => updateField('payment.defaultPrice', e.target.value)}
                disabled={!isEmpleadora}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Día de Vencimiento Mensual</Label>
              <Input
                type="number"
                value={formData['payment.dueDay']}
                onChange={(e) => updateField('payment.dueDay', e.target.value)}
                disabled={!isEmpleadora}
                min="1"
                max="28"
              />
              <p className="text-xs text-slate-500">Día del mes en que vencen los pagos</p>
            </div>
            <div className="space-y-2">
              <Label>Recargo por Mora (%)</Label>
              <Input
                type="number"
                value={formData['payment.lateFee']}
                onChange={(e) => updateField('payment.lateFee', e.target.value)}
                disabled={!isEmpleadora}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium">Cambio Automático de Estado</p>
              <p className="text-sm text-slate-500">Cambiar automáticamente a "Pendiente" al registrar asistencia sin pago</p>
            </div>
            <Switch
              checked={formData['payment.autoStatus'] === 'true'}
              onCheckedChange={(checked) => updateField('payment.autoStatus', checked ? 'true' : 'false')}
              disabled={!isEmpleadora}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Planes y Precios</CardTitle>
          <CardDescription>Define los planes de suscripción disponibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Plans */}
          {loadingPlans ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : plans.length > 0 ? (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    plan.isDefault ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        {plan.isDefault && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                            <Star className="w-3 h-3 inline mr-1" />
                            Predeterminado
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500">
                        {plan.classes} clases - {plan.price.toLocaleString('es-AR')} {plan.currency}
                      </span>
                    </div>
                  </div>
                  {isEmpleadora && (
                    <div className="flex items-center gap-2">
                      {!plan.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(plan.id)}
                          className="text-emerald-600"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4">No hay planes configurados</p>
          )}

          {/* Add New Plan */}
          {isEmpleadora && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Agregar Nuevo Plan</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <Input
                  placeholder="Nombre del plan"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Clases"
                  value={newPlan.classes}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, classes: e.target.value }))}
                  min="1"
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                  min="0"
                  step="0.01"
                />
                <Button onClick={handleAddPlan} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
