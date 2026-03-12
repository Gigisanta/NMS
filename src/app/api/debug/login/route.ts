import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('[DEBUG LOGIN] Email:', email)
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })
    
    console.log('[DEBUG LOGIN] User found:', user ? user.email : 'NO')
    console.log('[DEBUG LOGIN] User active:', user?.active)
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }
    
    if (!user.active) {
      return NextResponse.json({ error: 'Usuario inactivo' }, { status: 401 })
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log('[DEBUG LOGIN] Password valid:', isValid)
    console.log('[DEBUG LOGIN] Stored hash:', user.password.substring(0, 20) + '...')
    
    if (!isValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
  } catch (error) {
    console.error('[DEBUG LOGIN] Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
