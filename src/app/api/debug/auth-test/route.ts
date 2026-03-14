import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const user = await db.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        active: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found', email }, { status: 404 })
    }

    if (!user.active) {
      return NextResponse.json({ error: 'User inactive' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
      passwordValid: isValid,
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
