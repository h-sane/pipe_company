import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// 1. We spread the existing options
// 2. We EXPLICITLY overwrite the 'pages' config here to force the fix
const handler = NextAuth({
  ...authOptions,
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/signin',
    newUser: '/auth/signin'
  }
})

export { handler as GET, handler as POST }