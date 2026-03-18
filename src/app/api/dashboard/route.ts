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
          subStats,
          todayAttendances,
          recentClients,
          pendingClients,
          groupsWithRevenue,
          paidSubscriptions,
        ] = await Promise.all([
          // Total clients count
          db.client.count(),
          
          // Subscription counts and revenue by status for current month
          db.subscription.groupBy({
            by: ['status'],
            where: {
              month: currentMonth,
              year: currentYear,
            },
            _count: {
              _all: true,
            },
            _sum: {
              amount: true,
            },
          }),
          
          // Today's attendances count
          // BOLT OPTIMIZATION: Avoid inline date mutation for clarity and reliability
          (() => {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);
            return db.attendance.count({
              where: {
                date: {
                  gte: start,
                  lt: end,
                },
              },
            })
          })(),
          
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
          
          // Revenue by group for current month
          db.group.findMany({
            where: { active: true },
            select: {
              id: true,
              name: true,
              color: true,
              _count: {
                select: { clients: true },
              },
            },
          }),

          // BOLT OPTIMIZATION: Fetch all paid subscriptions at once to avoid N+1 queries when calculating group revenue
          db.subscription.findMany({
            where: {
              month: currentMonth,
              year: currentYear,
              status: 'AL_DIA',
            },
            select: {
              amount: true,
              client: {
                select: { grupoId: true },
              },
            },
          }),
        ])

        // BOLT OPTIMIZATION: Calculate projected revenue and collected revenue in-memory to eliminate N database calls
        // First, get all clients and their monthly projected amount
        const clientsData = await db.client.findMany({
          select: { id: true, grupoId: true, monthlyAmount: true }
        })

        const projectedByGroupMap = clientsData.reduce((acc, client) => {
          const groupId = client.grupoId || 'unassigned'
          acc[groupId] = (acc[groupId] || 0) + (client.monthlyAmount || 0)
          return acc
        }, {} as Record<string, number>)

        const revenueByGroupMap = paidSubscriptions.reduce((acc, sub) => {
          const groupId = sub.client.grupoId || 'unassigned'
          acc[groupId] = (acc[groupId] || 0) + (sub.amount || 0)
          return acc
        }, {} as Record<string, number>)

        const groupRevenue = groupsWithRevenue.map((group) => ({
          id: group.id,
          name: group.name,
          color: group.color,
          clientCount: group._count.clients,
          revenue: projectedByGroupMap[group.id] || 0, // Projected
          collected: revenueByGroupMap[group.id] || 0  // Collected
        }))


        // Calculate stats from optimized database queries
        const statusData = subStats.reduce((acc, curr) => {
          acc[curr.status] = {
            count: curr._count._all,
            revenue: curr._sum.amount || 0
          }
          return acc
        }, {} as Record<string, { count: number; revenue: number }>)

        const activeClients = subStats.reduce((sum, curr) => sum + curr._count._all, 0)
        const pendingPayments = statusData['PENDIENTE']?.count || 0
        const overduePayments = statusData['DEUDOR']?.count || 0
        const monthRevenue = statusData['AL_DIA']?.revenue || 0

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
          groupRevenue,
        }
      },
      60 * 1000 // 1 minute cache
    )

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
