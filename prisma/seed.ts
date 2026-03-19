import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Check if we're in production and SKIP_SEED is set
const shouldSkipSeed = process.env.SKIP_SEED === 'true' && process.env.NODE_ENV === 'production'

async function main() {
  console.log('🌱 Starting seed...\n')

  // In production with SKIP_SEED, don't touch existing data
  if (shouldSkipSeed) {
    console.log('⚠️  Production seed skipped (SKIP_SEED=true)\n')
    return
  }

  // Clean existing data (except users) - only in dev/seed scripts
  console.log('🗑️  Cleaning existing data...')
  await prisma.timeEntry.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.client.deleteMany()
  await prisma.group.deleteMany()
  console.log('✅ Data cleaned\n')

  // ============================================
  // CREATE/UPDATE INITIAL USERS (Idempotent - uses upsert)
  // ============================================
  console.log('👤 Creating/updating initial users...')

  // Create Mariela (Admin) - upsert to preserve existing data
  const hashedPasswordMariela = await bcrypt.hash('mariela123', 12)
  await prisma.user.upsert({
    where: { email: 'mariela@nms.com' },
    update: {
      name: 'Mariela',
      password: hashedPasswordMariela,
      role: Role.EMPLEADORA,
      active: true,
    },
    create: {
      name: 'Mariela',
      email: 'mariela@nms.com',
      password: hashedPasswordMariela,
      role: Role.EMPLEADORA,
      active: true,
    },
  })
  console.log('  ✅ Mariela upserted (Admin) - Password: mariela123')

  // Create Tomás (Empleado administrativo)
  const hashedPasswordTomas = await bcrypt.hash('tomas123', 12)
  await prisma.user.upsert({
    where: { email: 'tomas@nms.com' },
    update: {
      name: 'Tomás',
      password: hashedPasswordTomas,
      role: Role.EMPLEADO,
      employeeRole: 'ADMINISTRATIVO',
      phone: '+5491112345678',
      active: true,
    },
    create: {
      name: 'Tomás',
      email: 'tomas@nms.com',
      password: hashedPasswordTomas,
      role: Role.EMPLEADO,
      employeeRole: 'ADMINISTRATIVO',
      phone: '+5491112345678',
      active: true,
    },
  })
  console.log('  ✅ Tomás upserted (ADMINISTRATIVO) - Password: tomas123')

  // Create Camila (Empleado administrativo)
  const hashedPasswordCamila = await bcrypt.hash('camila123', 12)
  await prisma.user.upsert({
    where: { email: 'camila@nms.com' },
    update: {
      name: 'Camila',
      password: hashedPasswordCamila,
      role: Role.EMPLEADO,
      employeeRole: 'ADMINISTRATIVO',
      phone: '+5491198765432',
      active: true,
    },
    create: {
      name: 'Camila',
      email: 'camila@nms.com',
      password: hashedPasswordCamila,
      role: Role.EMPLEADO,
      employeeRole: 'ADMINISTRATIVO',
      phone: '+5491198765432',
      active: true,
    },
  })
  console.log('  ✅ Camila upserted (ADMINISTRATIVO) - Password: camila123')
  console.log()

  // ============================================
  // CREATE PRICING PLANS (if not exists - safe to re-run)
  // ============================================
  console.log('💰 Creating pricing plans...')
  const pricingPlansData = [
    { name: 'Mensual 4 clases', classes: 4, price: 5000, description: 'Plan básico - 4 clases por mes', isDefault: true },
    { name: 'Mensual 8 clases', classes: 8, price: 8500, description: 'Plan estándar - 8 clases por mes', isDefault: false },
    { name: 'Mensual 12 clases', classes: 12, price: 11000, description: 'Plan intensivo - 12 clases por mes', isDefault: false },
    { name: 'Clase individual', classes: 1, price: 1500, description: 'Una clase individual', isDefault: false },
  ]

  let plansCreated = 0
  for (const plan of pricingPlansData) {
    const existing = await prisma.pricingPlan.findFirst({ where: { name: plan.name } })
    if (!existing) {
      await prisma.pricingPlan.create({ data: plan })
      plansCreated++
    }
  }
  console.log(`  ✅ Ensured ${pricingPlansData.length} pricing plans (${plansCreated} created)\n`)

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
  console.log('  • Users: 3 (1 Admin, 2 Empleados)')
  console.log('  • Groups: 0')
  console.log('  • Clients: 0')
  console.log('  • Pricing Plans: 4')
  console.log('  • Settings: 10')
  console.log('\n🔑 Login credentials:')
  console.log('  • Mariela (Admin): mariela@nms.com / mariela123')
  console.log('  • Tomás (Empleado administrativo): tomas@nms.com / tomas123')
  console.log('  • Camila (Empleado administrativo): camila@nms.com / camila123')
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
