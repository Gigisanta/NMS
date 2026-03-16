'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, User, Mail, Phone, Lock, Save } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileSettingsProps {
  onProfileUpdate?: () => void
}

export function ProfileSettings({ onProfileUpdate }: ProfileSettingsProps) {
  const { data: session, update } = useSession()
  
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)

  const updateField = useCallback((key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSaveProfile = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
        }),
      })

      const result = await response.json()
      if (result.success) {
        await update({ name: formData.name })
        toast.success('Perfil actualizado')
        onProfileUpdate?.()
      } else {
        toast.error(result.error || 'Error al actualizar perfil')
      }
    } catch (error) {
      toast.error('Error al actualizar perfil')
    } finally {
      setSaving(false)
    }
  }, [formData.name, formData.phone, update, onProfileUpdate])

  const handleChangePassword = useCallback(async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      toast.error('Completa todos los campos de contraseña')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
        toast.success('Contraseña actualizada')
      } else {
        toast.error(result.error || 'Error al cambiar contraseña')
      }
    } catch (error) {
      toast.error('Error al cambiar contraseña')
    } finally {
      setSaving(false)
    }
  }, [formData])

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    return role === 'EMPLEADORA' ? 'Administrador' : 'Empleado'
  }

  const getRoleColor = (role: string) => {
    return role === 'EMPLEADORA' 
      ? 'bg-purple-100 text-purple-700' 
      : 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <User className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Mi Perfil</CardTitle>
              <CardDescription>Información personal y cuenta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{session?.user?.name || 'Usuario'}</h3>
              <p className="text-sm text-slate-500">{session?.user?.email}</p>
              <Badge className={`mt-1 ${getRoleColor(session?.user?.role || 'EMPLEADO')}`}>
                {getRoleLabel(session?.user?.role || 'EMPLEADO')}
              </Badge>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Email
                </Label>
                <Input
                  value={formData.email}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">El email no puede ser modificado</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                Teléfono
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+54 351 123 4567"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Cambiar Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Contraseña Actual</Label>
            <Input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => updateField('currentPassword', e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nueva Contraseña</Label>
              <Input
                type="password"
                value={formData.newPassword}
                onChange={(e) => updateField('newPassword', e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Contraseña</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleChangePassword} 
            disabled={saving || !formData.currentPassword || !formData.newPassword}
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Cambiar Contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
