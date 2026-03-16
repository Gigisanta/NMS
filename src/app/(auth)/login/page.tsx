'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Info } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const registered = searchParams?.get('registered')
  const error = searchParams?.get('error')
  const callbackUrl = searchParams?.get('callbackUrl') || '/'

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      {/* Background Image - Assumes the image is saved as public/bg-login.jpg */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 ease-in hover:scale-105"
        style={{ backgroundImage: "url('/bg-login.jpg')" }}
      />
      {/* Frosted Glass Overlay - Increased blur to hide image distortion while keeping brand colors */}
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-xl" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-slide-up">
        {/* Success message after registration */}
        {registered === 'true' && (
          <Alert className="bg-emerald-50 border-emerald-200">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">
              Cuenta creada exitosamente. Ahora puedes iniciar sesión.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Error message from auth */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <Info className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error === 'SessionRequired' 
                ? 'Debes iniciar sesión para acceder a esa página.'
                : 'Ha ocurrido un error. Por favor, intenta nuevamente.'}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="shadow-2xl rounded-3xl overflow-hidden backdrop-blur-md ring-1 ring-slate-900/5">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/50">
      <div className="w-full max-w-md">
        <div className="animate-pulse">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto mb-4" />
            <div className="h-6 bg-slate-200 rounded mb-2 w-32 mx-auto" />
            <div className="h-4 bg-slate-100 rounded mb-6 w-48 mx-auto" />
            <div className="space-y-4">
              <div className="h-11 bg-slate-100 rounded" />
              <div className="h-11 bg-slate-100 rounded" />
              <div className="h-11 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
