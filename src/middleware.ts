import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'nms-secret-key-change-in-production-2024'
)

const publicPaths = ['/login', '/register', '/api/auth', '/favicon.ico', '/_next', '/api/debug']

async function getTokenFromRequest(request: NextRequest): Promise<any | null> {
  // First try cookie
  const cookieToken = request.cookies.get('next-auth.session-token')?.value
  
  // Then try header (from localStorage)
  const headerToken = request.headers.get('x-auth-token')
  
  const token = cookieToken || headerToken
  
  if (!token) {
    return null
  }
  
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  if (pathname.includes('.') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith('/uploads/')) {
    return NextResponse.next()
  }
  
  try {
    const token = await getTokenFromRequest(request)
    
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
  } catch (error) {
    console.error('[Middleware] Token error:', error)
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
