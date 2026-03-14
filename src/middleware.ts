import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register', '/api/auth', '/favicon.ico', '/_next', '/api/debug', '/_next/static', '/_next/image', '/public', '/uploads', '/images']

const NEXT_AUTH_COOKIE_NAMES = [
  'next-auth.token',
  'next-auth.session-token',
  '__Secure-next-auth.token',
  '__Secure-next-auth.session-token',
]

function hasValidSession(request: NextRequest): boolean {
  return NEXT_AUTH_COOKIE_NAMES.some(name => request.cookies.has(name))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  if (pathname.includes('.') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }
  
  if (!hasValidSession(request)) {
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
