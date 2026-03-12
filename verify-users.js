const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('=== Verificando usuarios en la base de datos ===\n')
  
  const users = await prisma.user.findMany({
    select: { 
      id: true, email: true, name: true, role: true, active: true, password: true 
    }
  })
  
  console.log(`Total usuarios: ${users.length}\n`)
  
  for (const user of users) {
    console.log(`📧 Email: ${user.email}`)
    console.log(`   Nombre: ${user.name}`)
    console.log(`   Rol: ${user.role}`)
    console.log(`   Activo: ${user.active}`)
    console.log(`   Password hash: ${user.password.substring(0, 30)}...`)
    
    // Verificar que el hash es válido
    const isMariela = user.email === 'mariela@nms.com'
    if (isMariela) {
      const testPass = 'mariela123'
      const isValid = await bcrypt.compare(testPass, user.password)
      console.log(`   ✅ Verificando password "${testPass}": ${isValid ? 'CORRECTO' : 'INCORRECTO'}`)
    }
    console.log('')
  }
  
  // Test de login directo
  console.log('=== Test de login directo ===\n')
  
  const testUser = await prisma.user.findUnique({
    where: { email: 'mariela@nms.com' }
  })
  
  if (testUser) {
    console.log('Usuario encontrado en DB:', testUser.email)
    const passwordValida = await bcrypt.compare('mariela123', testUser.password)
    console.log('Password mariela123 es válida:', passwordValida)
  } else {
    console.log('❌ Usuario mariela@nms.com NO encontrado')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
