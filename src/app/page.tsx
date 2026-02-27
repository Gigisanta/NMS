'use client'

import { useState, lazy, Suspense, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

// Lazy load views for better initial bundle size
const DashboardView = lazy(() => import('@/components/modules/dashboard-view').then(m => ({ default: m.DashboardView })))
const ClientsView = lazy(() => import('@/components/modules/clients-view').then(m => ({ default: m.ClientsView })))
const AttendanceView = lazy(() => import('@/components/modules/attendance-view').then(m => ({ default: m.AttendanceView })))
const PaymentsView = lazy(() => import('@/components/modules/payments-view').then(m => ({ default: m.PaymentsView })))
const SettingsView = lazy(() => import('@/components/modules/settings-view').then(m => ({ default: m.SettingsView })))
const EmployeesView = lazy(() => import('@/components/modules/employees-view').then(m => ({ default: m.EmployeesView })))

// Loading skeleton for views
function ViewSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}

// Main page component
function Home() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [currentView, setCurrentView] = useState('dashboard')
  
  // Stable callback reference
  const handleNavigate = useCallback((view: string) => {
    setCurrentView(view)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
          <p className="text-slate-600 text-sm">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  // Render the appropriate view based on currentView state
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />
      case 'clientes':
        return <ClientsView onViewChange={handleNavigate} />
      case 'asistencias':
        return <AttendanceView />
      case 'pagos':
        return <PaymentsView />
      case 'empleados':
        // Only EMPLEADORA can access employees view
        if (session?.user?.role === 'EMPLEADORA') {
          return <EmployeesView />
        }
        return <DashboardView onNavigate={handleNavigate} />
      case 'configuracion':
        return <SettingsView />
      default:
        return <DashboardView onNavigate={handleNavigate} />
    }
  }

  return (
    <AppLayout currentView={currentView} onViewChange={handleNavigate}>
      <Suspense fallback={<ViewSkeleton />}>
        {renderView()}
      </Suspense>
    </AppLayout>
  )
}

export default Home
