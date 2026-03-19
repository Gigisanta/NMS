import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register', '/api/auth', '/favicon.ico', '/_next', '/api/debug', '/_next/static', '/_next/image', '/public', '/uploads', '/images']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Skip if public path or asset
  if (
    publicPaths.some(path => pathname.startsWith(path)) ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // 2. Fetch token with explicit config
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'nms-secret-key-change-in-production-2024',
    secureCookie: isProd
  })
  
  // 3. Handle unauthenticated users
  if (!token) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    
    // Pages redirect to login with callbackUrl
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public|uploads|images|bg-login.jpg).*)'],
}


