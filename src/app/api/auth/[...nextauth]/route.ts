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
        
        console.log('[AUTH] User found:', user ? user.email : 'NO')
        
        if (!user) {
          console.log('[AUTH] User not found, trying without lowercase...')
          const user2 = await prisma.user.findFirst({
            where: { email: { contains: email } }
          })
          if (user2) {
            console.log('[AUTH] Found user with contains:', user2.email)
          }
          return null
        }

        console.log('[AUTH] User active:', user.active)
        
        if (!user.active) {
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
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: 'nms-secret-key-change-in-production-2024',
  debug: true,
})

export { handler as GET, handler as POST }
