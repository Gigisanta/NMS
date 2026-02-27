import type { Role, EmployeeRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string | null
      email: string
      role: Role
      employeeRole?: EmployeeRole
      image?: string | null
    }
  }

  interface User {
    id: string
    name: string | null
    email: string
    role: Role
    employeeRole?: EmployeeRole
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name: string | null
    email: string
    role: Role
    employeeRole?: EmployeeRole
    image?: string | null
  }
}
