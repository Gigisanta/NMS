import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const prisma = new PrismaClient()

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'nms-secret-key-change-in-production-2024'
)

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log('[API/LOGIN] Request received')
  try {
    const { email, password } = await request.json()
    console.log('[API/LOGIN] Email:', email)
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })
    
    if (!user) {
      console.log('[API/LOGIN] User not found')
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }
    
    if (!user.active) {
      console.log('[API/LOGIN] User inactive')
      return NextResponse.json({ error: 'Usuario inactivo' }, { status: 401 })
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log('[API/LOGIN] Password valid:', isValid)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }
    
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeRole: user.employeeRole,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .setSubject(user.id)
      .sign(secret)
    
    console.log('[API/LOGIN] Token generated successfully')
    
    const response = NextResponse.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
    
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })
    
    console.log('[API/LOGIN] Cookie set in response')
    
    return response
  } catch (error) {
    console.error('[API/LOGIN ERROR]:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
