import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const currentMonth = getCurrentMonth()
    const currentYear = getCurrentYear()

    // Use cached fetch for dashboard data (1 minute cache)
    const data = await cachedFetch(
      CacheKeys.dashboard(),
      async () => {
        // Run all queries in parallel for better performance
        const [
          totalClients,
          subscriptions,
          todayAttendances,
          recentClients,
          pendingClients,
        ] = await Promise.all([
          // Total clients count
          db.client.count(),
          
          // Subscription stats for current month - only select needed fields
          db.subscription.findMany({
            where: {
              month: currentMonth,
              year: currentYear,
            },
            select: {
              status: true,
              amount: true,
            },
          }),
          
          // Today's attendances count
          db.attendance.count({
            where: {
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            },
          }),
          
          // Recent clients with minimal fields
          db.client.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              nombre: true,
              apellido: true,
              telefono: true,
              createdAt: true,
              grupo: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          }),
          
          // Clients with pending payments - minimal fields
          db.subscription.findMany({
            where: {
              month: currentMonth,
              year: currentYear,
              status: { in: ['PENDIENTE', 'DEUDOR'] },
            },
            select: {
              status: true,
              client: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  telefono: true,
                  grupo: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
            },
            take: 10,
            orderBy: { updatedAt: 'asc' },
          }),
        ])

        // Calculate stats from subscriptions (in-memory, fast)
        const activeClients = subscriptions.length
        const pendingPayments = subscriptions.filter((s) => s.status === 'PENDIENTE').length
        const overduePayments = subscriptions.filter((s) => s.status === 'DEUDOR').length
        const monthRevenue = subscriptions
          .filter((s) => s.status === 'AL_DIA')
          .reduce((sum, s) => sum + (s.amount || 0), 0)

        return {
          stats: {
            totalClients,
            activeClients,
            pendingPayments,
            overduePayments,
            todayAttendances,
            monthRevenue,
          },
          recentClients,
          pendingClients,
          currentMonth,
          currentYear,
        }
      },
      60 * 1000 // 1 minute cache
    )

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
