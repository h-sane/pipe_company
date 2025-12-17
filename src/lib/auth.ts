import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { UserRole, Permission } from '@prisma/client'
import { verifyPassword } from './encryption'
import { sanitizeEmail } from './input-sanitization'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Skip auth during build time to prevent db connection errors
        if (process.env.NEXT_PHASE === 'phase-production-build') {
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const sanitizedEmail = sanitizeEmail(credentials.email)
          if (!sanitizedEmail) return null

          const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail }
          }) as any

          if (!user || !user.passwordHash) return null

          const validPassword = await verifyPassword(credentials.password, user.passwordHash)
          if (!validPassword) return null

          if (user.role !== UserRole.ADMIN && user.role !== UserRole.CONTENT_MANAGER) {
            return null
          }

          // Fire and forget update (don't await to speed up login)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          }).catch(console.error)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
        token.iat = Math.floor(Date.now() / 1000)
      }
      
      if (trigger === 'update') {
        token.iat = Math.floor(Date.now() / 1000)
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.permissions = token.permissions as Permission[]
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        return user.role === UserRole.ADMIN || user.role === UserRole.CONTENT_MANAGER
      }
      return true
    }
  },
  // VITAL: This prevents NextAuth from trying to render default pages
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/signin',
    newUser: '/auth/signin'
  },
  // VITAL: This prevents NextAuth from loading default CSS
  theme: {
    colorScheme: 'light',
    brandColor: '#000000',
    logo: '',
    buttonText: ''
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}