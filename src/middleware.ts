import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicPaths = ['/login', '/register', '/api/auth', '/favicon.ico', '/_next', '/api/debug', '/_next/static', '/_next/image', '/public', '/uploads', '/images']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  if (pathname.includes('.') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }
  
  // Robust session detection using NextAuth utilities
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'nms-secret-key-change-in-production-2024'
  })
  
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/debug|_next/static|_next/image|favicon.ico|public|uploads|images).*)',
  ],
}

