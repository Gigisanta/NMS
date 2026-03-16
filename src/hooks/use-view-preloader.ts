'use client'

import { useCallback, useRef } from 'react'

const moduleMap = {
  dashboard: () => import('@/components/modules/dashboard-view').then(m => ({ default: m.DashboardView })),
  clientes: () => import('@/components/modules/clients-view').then(m => ({ default: m.ClientsView })),
  asistencias: () => import('@/components/modules/attendance-view').then(m => ({ default: m.AttendanceView })),
  pagos: () => import('@/components/modules/payments-view').then(m => ({ default: m.PaymentsView })),
  facturacion: () => import('@/components/modules/billing-view').then(m => ({ default: m.BillingView })),
  calendario: () => import('@/components/modules/calendar-view').then(m => ({ default: m.CalendarView })),
  configuracion: () => import('@/components/modules/settings-view').then(m => ({ default: m.SettingsView })),
  empleados: () => import('@/components/modules/employees-view').then(m => ({ default: m.EmployeesView })),
}

type ViewKey = keyof typeof moduleMap

const preloadedViews = new Set<ViewKey>()

export function useViewPreloader() {
  const timersRef = useRef<Map<ViewKey, NodeJS.Timeout>>(new Map())

  const preloadView = useCallback((viewId: string) => {
    if (viewId === 'dashboard' || !moduleMap[viewId as ViewKey]) return
    
    if (!preloadedViews.has(viewId as ViewKey)) {
      preloadedViews.add(viewId as ViewKey)
      moduleMap[viewId as ViewKey]()
    }
  }, [])

  const handleMouseEnter = useCallback((viewId: string) => {
    const existingTimer = timersRef.current.get(viewId as ViewKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      preloadView(viewId)
      timersRef.current.delete(viewId as ViewKey)
    }, 150)

    timersRef.current.set(viewId as ViewKey, timer)
  }, [preloadView])

  const handleMouseLeave = useCallback((viewId: string) => {
    const timer = timersRef.current.get(viewId as ViewKey)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(viewId as ViewKey)
    }
  }, [])

  return { preloadView, handleMouseEnter, handleMouseLeave }
}
