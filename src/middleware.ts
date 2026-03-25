import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

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
  
  // 2. Fetch token with more explicit config for Vercel
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'dev-only-secret-do-not-use-in-production',
    secureCookie: isProd
  })
  
  // 3. Handle unauthenticated users
  if (!token) {

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    
    // Pages redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public|uploads|images|bg-login.jpg).*)'],
}


