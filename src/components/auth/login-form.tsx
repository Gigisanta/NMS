'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, LogIn, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface LoginFormProps {
  callbackUrl?: string
}

export function LoginForm({ callbackUrl = '/' }: LoginFormProps) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    // Read error from URL on mount (NextAuth redirects with ?error=... on failure)
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('error') : null
  )
  const [loading, setLoading] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
    })
    
    if (result?.error) {
        setError(result.error || 'Credenciales inválidas')
        setLoading(false)
        return
    }

    if (!result?.ok) {
        setError('Error al iniciar sesión')
        setLoading(false)
        return
    }

    window.location.href = callbackUrl || '/'
}

  return (
    <Card className="w-full max-w-md mx-auto border border-border bg-card text-card-foreground relative overflow-hidden shadow-lg">
      {/* Subtle top accent bar for that Google-esque premium flair */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary to-primary" />

      <CardHeader className="text-center pb-2 pt-8">
        <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-border">
          <span className="text-primary text-2xl font-bold tracking-tight">NMS</span>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
          Bienvenido
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base mt-2">
          Sistema de Gestión de Natatorio
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
            <Label htmlFor="email" className="text-foreground font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:border-ring shadow-sm text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-semibold">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:border-ring shadow-sm text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg text-primary-foreground font-medium text-base rounded-full transition-all duration-300 mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </>
            )}
          </Button>

          <div className="text-center text-sm pt-4">
            <span className="text-muted-foreground">¿No tienes cuenta? </span>
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
