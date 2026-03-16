import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string | null
      email: string
      role: Role
      employeeRole?: string
      image?: string | null
    }
  }

  interface User {
    id: string
    name: string | null
    email: string
    role: Role
    employeeRole?: string
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name: string | null
    email: string
    role: Role
    employeeRole?: string
    image?: string | null
  }
}
