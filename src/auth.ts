import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import type { DefaultSession } from 'next-auth'
import { getServerSession } from 'next-auth'

// Extend session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      name: string | null
      email: string
      role: 'EMPLEADORA' | 'EMPLEADO'
      employeeRole?: string
      image?: string | null
    } & DefaultSession['user']
  }
  
  interface User {
    id: string
    name: string | null
    email: string
    role: 'EMPLEADORA' | 'EMPLEADO'
    employeeRole?: string
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name: string | null
    email: string
    role: 'EMPLEADORA' | 'EMPLEADO'
    employeeRole?: string
    image?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'correo@ejemplo.com' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth] Authorize called with:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials')
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Find user
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            employeeRole: true,
            active: true,
            image: true,
          },
        })

        if (!user) {
          console.log('[Auth] User not found:', email)
          return null
        }

        if (!user.active) {
          console.log('[Auth] User inactive:', email)
          return null
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
          console.log('[Auth] Invalid password for:', email)
          return null
        }

        console.log('[Auth] User authenticated successfully:', email)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeRole: user.employeeRole || undefined,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log('[Auth] JWT callback - user:', !!user, 'token:', !!token)
      
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
        token.employeeRole = user.employeeRole
        token.image = user.image
      }
      
      // Update session data when user updates their profile
      if (trigger === 'update' && session) {
        token.name = session.name
      }
      
      return token
    },
    async session({ session, token }) {
      console.log('[Auth] Session callback - token:', !!token)
      
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.role = token.role
        session.user.employeeRole = token.employeeRole
        session.user.image = token.image
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`[Auth] User signed in: ${user.email}`)
    },
    async signOut({ token }) {
      console.log(`[Auth] User signed out: ${token?.email}`)
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

// Auth function for API routes - MUST be defined before default export
export async function auth() {
  return getServerSession(authOptions)
}

// Helper to get current user on server
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

// Helper to require authentication
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

// Helper to require specific role
export async function requireRole(role: 'EMPLEADORA' | 'EMPLEADO') {
  const user = await requireAuth()
  if (user.role !== role && user.role !== 'EMPLEADORA') {
    throw new Error('Forbidden')
  }
  return user
}

// Default export - NextAuth handler (MUST be last)
export default NextAuth(authOptions)
