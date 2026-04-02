'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export function RegisterForm() {
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al registrarse')
        return
      }

      // Auto login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Registration successful but auto-login failed
        router.push('/login?registered=true')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('Error al registrarse. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-slate-100 shadow-sm">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)' }}>
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl font-semibold text-slate-900">
          Crear Cuenta
        </CardTitle>
        <CardDescription>
          Regístrate para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-11"
              minLength={6}
            />
            <p className="text-xs text-slate-500">Mínimo 6 caracteres</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full h-11 gap-2 text-white"
            style={{ background: '#005691' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Crear Cuenta
              </>
            )}
          </Button>
          
          <div className="text-center text-sm pt-2">
            <span className="text-slate-500">¿Ya tienes cuenta? </span>
            <Link 
              href="/login" 
              className="font-medium hover:underline"
              style={{ color: '#005691' }}
            >
              Iniciar sesión
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
