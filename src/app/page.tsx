'use client'

// NMS v0.2.4 - Deployment test
import { useState, lazy, Suspense, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

// Lazy load views for better initial bundle size
const DashboardView = lazy(() => import('@/components/modules/dashboard-view').then(m => ({ default: m.DashboardView })))
const ClientsView = lazy(() => import('@/components/modules/clients-view').then(m => ({ default: m.ClientsView })))
const AttendanceView = lazy(() => import('@/components/modules/attendance-view').then(m => ({ default: m.AttendanceView })))
const PaymentsView = lazy(() => import('@/components/modules/payments-view').then(m => ({ default: m.PaymentsView })))
const BillingView = lazy(() => import('@/components/modules/billing-view').then(m => ({ default: m.BillingView })))
const CalendarView = lazy(() => import('@/components/modules/calendar-view').then(m => ({ default: m.CalendarView })))
const SettingsView = lazy(() => import('@/components/modules/settings-view').then(m => ({ default: m.SettingsView })))
const EmployeesView = lazy(() => import('@/components/modules/employees-view').then(m => ({ default: m.EmployeesView })))
const ExpensesView = lazy(() => import('@/components/modules/expenses-view').then(m => ({ default: m.ExpensesView })))

// Valid view paths
const VALID_VIEWS = ['dashboard', 'clientes', 'asistencias', 'pagos', 'facturacion', 'calendario', 'configuracion', 'empleados', 'gastos'] as const
type ValidView = typeof VALID_VIEWS[number]

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
  const pathname = usePathname()
  const [currentView, setCurrentView] = useState<ValidView>('dashboard')

  // Stable callback reference
  const handleNavigate = useCallback((view: string) => {
    setCurrentView(view as ValidView)
  }, [])

  // Sincronizar currentView con URL al montar
  useEffect(() => {
    const path = pathname === '/' ? 'dashboard' : pathname.slice(1)
    if (VALID_VIEWS.includes(path as ValidView)) {
      setCurrentView(path as ValidView)
    }
  }, [pathname])

  // Cuando cambia currentView, actualizar URL sin reload
  useEffect(() => {
    const newUrl = currentView === 'dashboard' ? '/' : `/${currentView}`
    window.history.pushState({}, '', newUrl)
  }, [currentView])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Preload most used views in background after dashboard loads
  useEffect(() => {
    if (status === 'authenticated') {
      const timer = setTimeout(() => {
        import('@/components/modules/clients-view')
        import('@/components/modules/payments-view')
        import('@/components/modules/attendance-view')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status])

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
      case 'facturacion':
        return <BillingView />
      case 'calendario':
        return <CalendarView />
      case 'empleados':
        // Only EMPLEADORA can access employees view
        if (session?.user?.role === 'EMPLEADORA') {
          return <EmployeesView />
        }
        return <DashboardView onNavigate={handleNavigate} />
      case 'configuracion':
        return <SettingsView />
      case 'gastos':
        return <ExpensesView />
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

// Wrapped page component with QueryClientProvider
export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  )
}
