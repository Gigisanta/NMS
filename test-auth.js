const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true, active: true, password: true }
  })
  
  console.log('=== Users in database ===')
  for (const user of users) {
    console.log('- Email:', user.email)
    console.log('  Name:', user.name)
    console.log('  Role:', user.role)
    console.log('  Active:', user.active)
    console.log('')
  }
  
  // Test passwords
  const testCases = [
    { email: 'mariela@nms.com', password: 'mariela123' },
    { email: 'tomas@nms.com', password: 'tomas123' },
    { email: 'carlos@nms.com', password: 'carlos123' },
    { email: 'maria@nms.com', password: 'maria123' },
  ]
  
  console.log('=== Testing passwords ===')
  for (const tc of testCases) {
    const user = users.find(u => u.email === tc.email)
    if (user) {
      const isValid = await bcrypt.compare(tc.password, user.password)
      console.log(`${tc.email} + ${tc.password}: ${isValid ? 'OK' : 'FAIL'}`)
    } else {
      console.log(`${tc.email}: USER NOT FOUND`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
