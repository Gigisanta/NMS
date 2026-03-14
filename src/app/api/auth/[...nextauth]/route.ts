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
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const email = credentials.email.trim().toLowerCase()
          const password = credentials.password
          
          const user = await prisma.user.findFirst({
            where: { 
              email: {
                equals: email,
                mode: 'insensitive'
              }
            }
          })
          
          if (!user || !user.active) {
            return null
          }

          const isValid = await bcrypt.compare(password, user.password)
          
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
          console.error('[AUTH] Error:', error)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'dev-fallback-secret-do-not-use-in-prod',
  debug: true,
})

export { handler as GET, handler as POST }
