import { PrismaClient, Role, EmployeeRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Predefined colors for groups
const groupColors = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#ec4899', // pink
  '#3b82f6', // blue
  '#84cc16', // lime
]

// Sample groups data
const groupsData = [
  { name: 'Grupo A', description: 'Niños principiantes', schedule: 'Lunes y Miércoles 10:00' },
  { name: 'Grupo B', description: 'Niños avanzados', schedule: 'Martes y Jueves 16:00' },
  { name: 'Adultos Mañana', description: 'Adultos turno mañana', schedule: 'Lunes a Viernes 08:00' },
  { name: 'Adultos Noche', description: 'Adultos turno noche', schedule: 'Lunes a Viernes 19:00' },
  { name: 'Competitivo', description: 'Natación competitiva', schedule: 'Martes y Jueves 06:00' },
  { name: 'Acuagym', description: 'Aeróbica acuática', schedule: 'Miércoles y Viernes 18:00' },
]

// Sample client names
const clientNames = [
  { nombre: 'Juan', apellido: 'Pérez' },
  { nombre: 'María', apellido: 'García' },
  { nombre: 'Carlos', apellido: 'López' },
  { nombre: 'Ana', apellido: 'Martínez' },
  { nombre: 'Luis', apellido: 'Rodríguez' },
  { nombre: 'Laura', apellido: 'Sánchez' },
  { nombre: 'Pedro', apellido: 'González' },
  { nombre: 'Sofía', apellido: 'Hernández' },
  { nombre: 'Diego', apellido: 'Fernández' },
  { nombre: 'Valentina', apellido: 'Díaz' },
  { nombre: 'Andrés', apellido: 'Torres' },
  { nombre: 'Camila', apellido: 'Ramírez' },
  { nombre: 'Miguel', apellido: 'Flores' },
  { nombre: 'Isabella', apellido: 'Rivera' },
  { nombre: 'Javier', apellido: 'Gómez' },
  { nombre: 'Lucía', apellido: 'Morales' },
  { nombre: 'Fernando', apellido: 'Reyes' },
  { nombre: 'Renata', apellido: 'Cruz' },
  { nombre: 'Pablo', apellido: 'Ortiz' },
  { nombre: 'Victoria', apellido: 'Jiménez' },
]

async function main() {
  console.log('🌱 Starting seed...\n')

  // Clean existing data (except users)
  console.log('🗑️  Cleaning existing data...')
  await prisma.timeEntry.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.client.deleteMany()
  await prisma.group.deleteMany()
  console.log('✅ Data cleaned\n')

  // ============================================
  // CREATE INITIAL USERS
  // ============================================
  console.log('👤 Creating initial users...')
  
  // Check if users already exist
  const existingMariela = await prisma.user.findUnique({ where: { email: 'mariela@nms.com' } })
  const existingTomas = await prisma.user.findUnique({ where: { email: 'tomas@nms.com' } })
  const existingCarlos = await prisma.user.findUnique({ where: { email: 'carlos@nms.com' } })
  const existingMaria = await prisma.user.findUnique({ where: { email: 'maria@nms.com' } })
  
  // Create Mariela (EMPLEADORA - Boss)
  if (!existingMariela) {
    const hashedPasswordMariela = await bcrypt.hash('mariela123', 12)
    await prisma.user.create({
      data: {
        name: 'Mariela González',
        email: 'mariela@nms.com',
        password: hashedPasswordMariela,
        role: Role.EMPLEADORA,
        active: true,
      },
    })
    console.log('  ✅ Mariela created (EMPLEADORA) - Password: mariela123')
  } else {
    console.log('  ⏭️  Mariela already exists')
  }
  
  // Create Tomás (EMPLEADO - PROFESOR)
  if (!existingTomas) {
    const hashedPasswordTomas = await bcrypt.hash('tomas123', 12)
    await prisma.user.create({
      data: {
        name: 'Tomás Rodríguez',
        email: 'tomas@nms.com',
        password: hashedPasswordTomas,
        role: Role.EMPLEADO,
        employeeRole: EmployeeRole.PROFESOR,
        hourlyRate: 1500,
        phone: '+5491112345678',
        active: true,
      },
    })
    console.log('  ✅ Tomás created (PROFESOR) - Password: tomas123')
  } else {
    console.log('  ⏭️  Tomás already exists')
  }
  
  // Create Carlos (EMPLEADO - ADMINISTRATIVO)
  if (!existingCarlos) {
    const hashedPasswordCarlos = await bcrypt.hash('carlos123', 12)
    await prisma.user.create({
      data: {
        name: 'Carlos Martínez',
        email: 'carlos@nms.com',
        password: hashedPasswordCarlos,
        role: Role.EMPLEADO,
        employeeRole: EmployeeRole.ADMINISTRATIVO,
        hourlyRate: 1200,
        phone: '+5491198765432',
        active: true,
      },
    })
    console.log('  ✅ Carlos created (ADMINISTRATIVO) - Password: carlos123')
  } else {
    console.log('  ⏭️  Carlos already exists')
  }
  
  // Create María (EMPLEADO - LIMPIEZA)
  if (!existingMaria) {
    const hashedPasswordMaria = await bcrypt.hash('maria123', 12)
    await prisma.user.create({
      data: {
        name: 'María López',
        email: 'maria@nms.com',
        password: hashedPasswordMaria,
        role: Role.EMPLEADO,
        employeeRole: EmployeeRole.LIMPIEZA,
        hourlyRate: 1000,
        phone: '+5491156781234',
        active: true,
      },
    })
    console.log('  ✅ María created (LIMPIEZA) - Password: maria123')
  } else {
    console.log('  ⏭️  María already exists')
  }
  console.log()

  // ============================================
  // CREATE GROUPS
  // ============================================
  console.log('🏷️  Creating groups...')
  const groups = await Promise.all(
    groupsData.map((group, index) =>
      prisma.group.create({
        data: {
          name: group.name,
          color: groupColors[index % groupColors.length],
          description: group.description,
          schedule: group.schedule,
        },
      })
    )
  )
  console.log(`  ✅ Created ${groups.length} groups\n`)

  // ============================================
  // CREATE CLIENTS
  // ============================================
  console.log('👥 Creating clients...')
  const clients = await Promise.all(
    clientNames.map((name, index) => {
      const groupIndex = index % groups.length
      const dni = Math.floor(10000000 + Math.random() * 40000000).toString()
      const phone = `+54911${Math.floor(10000000 + Math.random() * 90000000)}`
      
      // Generate preferred days
      const dayOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
      const preferredDaysCount = Math.floor(Math.random() * 2) + 1
      const preferredDays = dayOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, preferredDaysCount)
        .join(',')
      
      // Generate preferred time
      const times = ['08:00', '10:00', '14:00', '16:00', '18:00', '19:00']
      const preferredTime = times[Math.floor(Math.random() * times.length)]
      
      return prisma.client.create({
        data: {
          nombre: name.nombre,
          apellido: name.apellido,
          dni,
          telefono: phone,
          grupoId: groups[groupIndex].id,
          preferredDays,
          preferredTime,
        },
      })
    })
  )
  console.log(`  ✅ Created ${clients.length} clients\n`)

  // ============================================
  // CREATE SUBSCRIPTIONS (Current Month)
  // ============================================
  console.log('💳 Creating subscriptions...')
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  const statuses = ['AL_DIA', 'AL_DIA', 'AL_DIA', 'PENDIENTE', 'PENDIENTE', 'DEUDOR']
  const amounts = [5000, 6000, 7000, 8000]
  
  const subscriptions = await Promise.all(
    clients.map((client, index) => {
      const status = statuses[index % statuses.length]
      const classesTotal = Math.floor(Math.random() * 3) + 4 // 4-6 classes
      const classesUsed = status === 'AL_DIA' 
        ? Math.floor(Math.random() * classesTotal)
        : status === 'PENDIENTE'
        ? Math.floor(Math.random() * 2)
        : Math.floor(Math.random() * 3) + 2
      const amount = amounts[index % amounts.length]
      
      return prisma.subscription.create({
        data: {
          clientId: client.id,
          month: currentMonth,
          year: currentYear,
          status,
          classesTotal,
          classesUsed,
          amount,
        },
      })
    })
  )
  console.log(`  ✅ Created ${subscriptions.length} subscriptions\n`)

  // ============================================
  // CREATE ATTENDANCES
  // ============================================
  console.log('✅ Creating attendances...')
  
  // Today's attendances
  const todayAttendances = await Promise.all(
    clients.slice(0, 10).map((client) =>
      prisma.attendance.create({
        data: {
          clientId: client.id,
          date: new Date(),
        },
      })
    )
  )
  
  // Historical attendances (last 30 days)
  const historicalAttendances: Promise<unknown>[] = []
  for (let day = 1; day <= 30; day++) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    
    const randomClients = clients
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 5) + 3)
    
    for (const client of randomClients) {
      historicalAttendances.push(
        prisma.attendance.create({
          data: {
            clientId: client.id,
            date,
          },
        })
      )
    }
  }
  
  await Promise.all(historicalAttendances)
  console.log(`  ✅ Created ${todayAttendances.length + historicalAttendances.length} attendances\n`)

  // ============================================
  // CREATE TIME ENTRIES (Sample data for employees)
  // ============================================
  console.log('⏰ Creating sample time entries...')
  
  const employees = await prisma.user.findMany({
    where: { role: Role.EMPLEADO },
  })
  
  for (const employee of employees) {
    // Create some time entries for the past week
    for (let day = 0; day < 7; day++) {
      const date = new Date()
      date.setDate(date.getDate() - day)
      date.setHours(8, 0, 0, 0) // Start at 8 AM
      
      // Random chance of working this day
      if (Math.random() > 0.3) {
        const clockIn = new Date(date)
        clockIn.setHours(8 + Math.floor(Math.random() * 2)) // 8-9 AM
        
        const clockOut = new Date(clockIn)
        clockOut.setHours(clockIn.getHours() + 6 + Math.floor(Math.random() * 3)) // 6-9 hours later
        
        await prisma.timeEntry.create({
          data: {
            userId: employee.id,
            clockIn,
            clockOut,
          },
        })
      }
    }
  }
  console.log('  ✅ Created sample time entries\n')

  // ============================================
  // CREATE INVOICES
  // ============================================
  console.log('📄 Creating invoices...')
  const invoices = await Promise.all(
    subscriptions
      .filter((sub) => sub.status === 'AL_DIA')
      .slice(0, 16)
      .map((sub) =>
        prisma.invoice.create({
          data: {
            clientId: sub.clientId,
            imageUrl: '/placeholder-receipt.jpg',
            verified: true,
          },
        })
      )
  )
  console.log(`  ✅ Created ${invoices.length} invoices\n`)

  // ============================================
  // CREATE PRICING PLANS
  // ============================================
  console.log('💰 Creating pricing plans...')
  const pricingPlans = await Promise.all([
    prisma.pricingPlan.create({
      data: {
        name: 'Mensual 4 clases',
        classes: 4,
        price: 5000,
        currency: 'ARS',
        description: 'Plan básico - 4 clases por mes',
        isDefault: true,
      },
    }),
    prisma.pricingPlan.create({
      data: {
        name: 'Mensual 8 clases',
        classes: 8,
        price: 8500,
        currency: 'ARS',
        description: 'Plan estándar - 8 clases por mes',
        isDefault: false,
      },
    }),
    prisma.pricingPlan.create({
      data: {
        name: 'Mensual 12 clases',
        classes: 12,
        price: 11000,
        currency: 'ARS',
        description: 'Plan intensivo - 12 clases por mes',
        isDefault: false,
      },
    }),
    prisma.pricingPlan.create({
      data: {
        name: 'Clase individual',
        classes: 1,
        price: 1500,
        currency: 'ARS',
        description: 'Una clase individual',
        isDefault: false,
      },
    }),
  ])
  console.log(`  ✅ Created ${pricingPlans.length} pricing plans\n`)

  // ============================================
  // CREATE DEFAULT SETTINGS
  // ============================================
  console.log('⚙️  Creating default settings...')
  const defaultSettings = [
    { key: 'business.name', value: 'NMS - Natatory Management System', category: 'business', description: 'Nombre del negocio' },
    { key: 'business.currency', value: 'ARS', category: 'business', description: 'Moneda principal' },
    { key: 'business.timezone', value: 'America/Argentina/Cordoba', category: 'business', description: 'Zona horaria' },
    { key: 'payment.defaultClasses', value: '4', category: 'payment', description: 'Clases por defecto' },
    { key: 'payment.defaultPrice', value: '5000', category: 'payment', description: 'Precio por defecto' },
    { key: 'payment.dueDay', value: '10', category: 'payment', description: 'Día de vencimiento' },
    { key: 'payment.autoStatus', value: 'true', category: 'payment', description: 'Cambio automático de estado' },
    { key: 'notifications.paymentReminder', value: 'true', category: 'notifications', description: 'Recordatorio de pago' },
    { key: 'notifications.paymentReminderDays', value: '3', category: 'notifications', description: 'Días de anticipación' },
    { key: 'notifications.overdueNotification', value: 'true', category: 'notifications', description: 'Notificación de mora' },
  ]

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log(`  ✅ Created ${defaultSettings.length} default settings\n`)

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════')
  console.log('🎉 Seed completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`  • Users: 4 (1 EMPLEADORA, 3 EMPLEADOS)`)
  console.log(`  • Groups: ${groups.length}`)
  console.log(`  • Clients: ${clients.length}`)
  console.log(`  • Subscriptions: ${subscriptions.length}`)
  console.log(`  • Attendances: ${todayAttendances.length + historicalAttendances.length}`)
  console.log(`  • Invoices: ${invoices.length}`)
  console.log(`  • Pricing Plans: ${pricingPlans.length}`)
  console.log(`  • Settings: ${defaultSettings.length}`)
  console.log('\n🔑 Login credentials:')
  console.log('  • Mariela (EMPLEADORA): mariela@nms.com / mariela123')
  console.log('  • Tomás (PROFESOR): tomas@nms.com / tomas123')
  console.log('  • Carlos (ADMINISTRATIVO): carlos@nms.com / carlos123')
  console.log('  • María (LIMPIEZA): maria@nms.com / maria123')
  console.log('═══════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
