'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Loader2, Save, Globe, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsMap {
  [key: string]: {
    value: string
    category: string
    description: string | null
  }
}

export function BusinessSettings() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
  })

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings?category=business')
      const result = await response.json()
      if (result.success && result.data) {
        const settings = result.data as SettingsMap
        const getSetting = (key: string) => 
          settings[key]?.value || ''
        
        setFormData({
          businessName: getSetting('business.name'),
          businessEmail: getSetting('business.email'),
          businessPhone: getSetting('business.phone'),
          businessAddress: getSetting('business.address'),
          currency: getSetting('business.currency') || 'ARS',
          timezone: getSetting('business.timezone') || 'America/Argentina/Buenos_Aires',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings()
  }, [fetchSettings])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const updates = [
        { key: 'business.name', value: formData.businessName },
        { key: 'business.email', value: formData.businessEmail },
        { key: 'business.phone', value: formData.businessPhone },
        { key: 'business.address', value: formData.businessAddress },
        { key: 'business.currency', value: formData.currency },
        { key: 'business.timezone', value: formData.timezone },
      ]

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Configuración guardada')
      } else {
        toast.error(result.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }, [formData])

  if (session?.user?.role !== 'EMPLEADORA') {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No tienes permisos para ver esta sección</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Datos del Negocio</CardTitle>
            <CardDescription>Información general del negocio</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre del Negocio</Label>
            <Input
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="NMS Natatorio"
            />
          </div>
          <div className="space-y-2">
            <Label>Email de Contacto</Label>
            <Input
              type="email"
              value={formData.businessEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
              placeholder="contacto@natatorio.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input
              value={formData.businessPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
              placeholder="+54 351 123 4567"
            />
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={formData.businessAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
              placeholder="Av. Principal 123"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Moneda
            </Label>
            <Select 
              value={formData.currency} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Zona Horaria
            </Label>
            <Select 
              value={formData.timezone} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</SelectItem>
                <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                <SelectItem value="America/Bogota">Colombia (GMT-5)</SelectItem>
                <SelectItem value="America/Santiago">Chile (GMT-4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
