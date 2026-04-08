import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const currentMonth = getCurrentMonth()
    const currentYear = getCurrentYear()

    // BOLT OPTIMIZATION: Wrap dashboard stats in cachedFetch (1 minute TTL)
    const data = await cachedFetch(
      CacheKeys.dashboard(),
      async () => {
        // Run all queries in parallel for better performance
        // BOLT OPTIMIZATION: Moved N+1 group revenue queries into parallel batch fetching
        const [
          totalClients,
          subStats,
          todayAttendances,
          recentClients,
          pendingClients,
          activeGroups,
          projectedRevenueByGroup,
          collectedSubscriptions,
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

          // Active groups for summary
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

          // BOLT OPTIMIZATION: Batch fetch projected revenue per group
          db.client.groupBy({
            by: ['grupoId'],
            _sum: {
              monthlyAmount: true,
            },
          }),

          // BOLT OPTIMIZATION: Batch fetch collected revenue (AL_DIA) for the current month
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

        // BOLT OPTIMIZATION: Aggregate collected revenue in-memory (O(N) where N is paid subscriptions)
        const collectedByGroup = collectedSubscriptions.reduce((acc, sub) => {
          const gId = sub.client?.grupoId || 'ungrouped'
          acc[gId] = (acc[gId] || 0) + (sub.amount?.toNumber() ?? 0)
          return acc
        }, {} as Record<string, number>)

        // BOLT OPTIMIZATION: Process projected revenue in-memory
        const projectedByGroup = projectedRevenueByGroup.reduce((acc, curr) => {
          const gId = curr.grupoId || 'ungrouped'
          acc[gId] = Number(curr._sum.monthlyAmount) || 0
          return acc
        }, {} as Record<string, number>)

        // BOLT OPTIMIZATION: Merge data efficiently O(G) where G is number of groups
        const groupRevenue = activeGroups.map((group) => ({
          id: group.id,
          name: group.name,
          color: group.color,
          clientCount: group._count.clients,
          revenue: projectedByGroup[group.id] || 0,
          collected: collectedByGroup[group.id] || 0,
        }))


        // Calculate stats from optimized database queries
        const statusData = subStats.reduce((acc, curr) => {
          acc[curr.status] = {
            count: curr._count._all,
            revenue: Number(curr._sum.amount) || 0
          }
          return acc
        }, {} as Record<string, { count: number; revenue: number }>)

        const activeClients = subStats
          .filter(s => s.status === 'AL_DIA' || s.status === 'PENDIENTE')
          .reduce((sum, curr) => sum + curr._count._all, 0)
        const alDiaClients = subStats
          .filter(s => s.status === 'AL_DIA')
          .reduce((sum, curr) => sum + curr._count._all, 0)
        const pendingPayments = statusData['PENDIENTE']?.count || 0
        const overduePayments = statusData['DEUDOR']?.count || 0
        const monthRevenue = statusData['AL_DIA']?.revenue || 0

        return {
          stats: {
            totalClients,
            activeClients,
            alDiaClients,
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
