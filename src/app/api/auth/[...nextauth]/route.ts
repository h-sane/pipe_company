import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const handler = NextAuth({
  ...authOptions,
  // 1. Force use of custom pages
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/signin',
    newUser: '/auth/signin'
  },
  // 2. FORCE a custom theme to prevent loading default-stylesheet.css
  theme: {
    colorScheme: 'light',
    brandColor: '#000000',
    logo: '',
    buttonText: ''
  }
})

export { handler as GET, handler as POST }