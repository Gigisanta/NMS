'use client'

import { useCallback, useRef, useEffect } from 'react'

const moduleMap = {
  dashboard: () => import('@/components/modules/dashboard-view').then(m => ({ default: m.DashboardView })),
  clientes: () => import('@/components/modules/clients-view').then(m => ({ default: m.ClientsView })),
  facturacion: () => import('@/components/modules/billing-view').then(m => ({ default: m.BillingView })),
  calendario: () => import('@/components/modules/calendar-view').then(m => ({ default: m.CalendarView })),
  configuracion: () => import('@/components/modules/settings-view').then(m => ({ default: m.SettingsView })),
  empleados: () => import('@/components/modules/employees-view').then(m => ({ default: m.EmployeesView })),
  gastos: () => import('@/components/modules/expenses-view').then(m => ({ default: m.ExpensesView })),
}

type ViewKey = keyof typeof moduleMap

export function useViewPreloader() {
  const timersRef = useRef<Map<ViewKey, NodeJS.Timeout>>(new Map())
  const preloadedViewsRef = useRef<Set<ViewKey>>(new Set())

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  const preloadView = useCallback((viewId: string) => {
    if (viewId === 'dashboard' || !moduleMap[viewId as ViewKey]) return

    if (!preloadedViewsRef.current.has(viewId as ViewKey)) {
      preloadedViewsRef.current.add(viewId as ViewKey)
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
