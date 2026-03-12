import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public paths that don't require authentication
const publicPaths = ['/login', '/register', '/api/auth', '/favicon.ico', '/_next', '/api/debug']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public paths FIRST
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Allow static files
  if (pathname.includes('.') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }
  
  // Allow uploads folder
  if (pathname.startsWith('/uploads/')) {
    return NextResponse.next()
  }
  
  // Get token using next-auth/jwt
  const secret = process.env.NEXTAUTH_SECRET || 'nms_super_secret_key_2024_production_ready_32chars'
  
  try {
    const token = await getToken({
      req: request,
      secret,
    })
    
    if (!token) {
      // API requests return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'No autenticado' },
          { status: 401 }
        )
      }
      
      // Redirect to login for page requests
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    console.error('[Middleware] Token error:', error)
    // API requests return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // Redirect to login for page requests
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
