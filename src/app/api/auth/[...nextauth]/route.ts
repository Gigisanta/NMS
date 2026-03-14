import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] Authorize called with:', credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials')
            return null
          }

          const email = credentials.email.trim().toLowerCase()
          const password = credentials.password
          
          console.log('[AUTH] Looking for user:', email)
          
          const user = await prisma.user.findUnique({
            where: { email }
          })
          
          console.log('[AUTH] User found:', user ? user.email : 'NO', 'active:', user?.active)
          
          if (!user) {
            return null
          }

          if (!user.active) {
            console.log('[AUTH] User inactive')
            return null
          }

          const isValid = await bcrypt.compare(password, user.password)
          console.log('[AUTH] Password valid:', isValid)
          
          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error('[AUTH] Error in authorize:', error)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_URL + '-secret-fallback',
  debug: true,
})

export { handler as GET, handler as POST }
