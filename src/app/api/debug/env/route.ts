import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  })
}
