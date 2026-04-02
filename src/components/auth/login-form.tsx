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
    <Card className="w-full max-w-md mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 bg-white text-slate-900 relative overflow-hidden">
      {/* Subtle top accent bar for that Google-esque premium flair */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00A8E8] to-[#005691]" />
      
      <CardHeader className="text-center pb-2 pt-8">
        <div className="mx-auto w-16 h-16 bg-[#F0F8FF] rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-[#005691]/10">
          <span className="text-[#005691] text-2xl font-bold tracking-tight">NMS</span>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
          Bienvenido
        </CardTitle>
        <CardDescription className="text-slate-500 text-base mt-2">
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
            <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#00A8E8] focus-visible:border-[#00A8E8] shadow-sm text-base"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-semibold">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#00A8E8] focus-visible:border-[#00A8E8] shadow-sm text-base"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full h-12 gap-2 bg-[#005691] hover:bg-[#0078B0] shadow-md hover:shadow-lg text-white font-medium text-base rounded-full transition-all duration-300 mt-2"
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
            <span className="text-slate-500">¿No tienes cuenta? </span>
            <Link 
              href="/register" 
              className="text-[#005691] hover:text-[#00A8E8] font-semibold transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
