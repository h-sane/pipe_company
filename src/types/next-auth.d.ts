import NextAuth from 'next-auth'
import { Permission } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: string
      permissions?: Permission[]
    }
  }

  interface User {
    role?: string
    permissions?: Permission[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    permissions?: Permission[]
  }
}