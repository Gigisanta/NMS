import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      }
    })
    
    const count = await prisma.user.count()
    
    return NextResponse.json({
      users,
      total: count,
      message: count === 0 ? 'No users in database - seed may have failed' : 'Users found'
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
