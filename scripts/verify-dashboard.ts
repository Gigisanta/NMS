import { db } from '../src/lib/db'
import { getCurrentMonth, getCurrentYear } from '../src/lib/utils'

async function verifyDashboard() {
  console.log('🔍 Verifying Dashboard optimized queries...')

  const currentMonth = getCurrentMonth()
  const currentYear = getCurrentYear()

  try {
    // 1. Replicate the optimized queries
    const [
      totalClients,
      subStats,
    ] = await Promise.all([
      db.client.count(),
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
    ])

    console.log('✅ Queries executed successfully')

    // 2. Validate data consistency with the old method (manual calculation)
    const allSubscriptions = await db.subscription.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
      },
      select: {
        status: true,
        amount: true,
      },
    })

    const expectedActiveClients = allSubscriptions.length
    const expectedPendingPayments = allSubscriptions.filter((s) => s.status === 'PENDIENTE').length
    const expectedOverduePayments = allSubscriptions.filter((s) => s.status === 'DEUDOR').length
    const expectedMonthRevenue = allSubscriptions
      .filter((s) => s.status === 'AL_DIA')
      .reduce((sum, s) => sum + (s.amount || 0), 0)

    const statusData = subStats.reduce((acc, curr) => {
      acc[curr.status] = {
        count: curr._count._all,
        revenue: curr._sum.amount || 0
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const actualActiveClients = subStats.reduce((sum, curr) => sum + curr._count._all, 0)
    const actualPendingPayments = statusData['PENDIENTE']?.count || 0
    const actualOverduePayments = statusData['DEUDOR']?.count || 0
    const actualMonthRevenue = statusData['AL_DIA']?.revenue || 0

    console.log('📊 Stats Comparison:')
    console.log(`- Active Clients: Expected ${expectedActiveClients}, Got ${actualActiveClients}`)
    console.log(`- Pending Payments: Expected ${expectedPendingPayments}, Got ${actualPendingPayments}`)
    console.log(`- Overdue Payments: Expected ${expectedOverduePayments}, Got ${actualOverduePayments}`)
    console.log(`- Month Revenue: Expected ${expectedMonthRevenue}, Got ${actualMonthRevenue}`)

    if (
      expectedActiveClients === actualActiveClients &&
      expectedPendingPayments === actualPendingPayments &&
      expectedOverduePayments === actualOverduePayments &&
      expectedMonthRevenue === actualMonthRevenue
    ) {
      console.log('✨ SUCCESS: Dashboard optimized logic is correct!')
    } else {
      console.error('❌ FAILURE: Dashboard optimized logic produced incorrect results!')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Error during verification:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

verifyDashboard()
