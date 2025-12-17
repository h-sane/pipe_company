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
        // Skip auth during build time
        if (process.env.NEXT_PHASE === 'phase-production-build') {
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Sanitize email input
          const sanitizedEmail = sanitizeEmail(credentials.email)
          if (!sanitizedEmail) {
            return null
          }

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail }
          }) as any

          if (!user || !user.passwordHash) {
            return null
          }

          // Verify password using secure hashing
          const validPassword = await verifyPassword(credentials.password, user.passwordHash)

          if (!validPassword) {
            return null
          }

          // Check if user has admin or content manager role
          if (user.role !== UserRole.ADMIN && user.role !== UserRole.CONTENT_MANAGER) {
            return null
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

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
      
      // Refresh token data periodically for security
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
      // Additional security checks can be added here
      if (account?.provider === 'credentials') {
        // Only allow admin and content manager roles to sign in
        return user.role === UserRole.ADMIN || user.role === UserRole.CONTENT_MANAGER
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours for security
    updateAge: 2 * 60 * 60, // Update session every 2 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 // 8 hours
      }
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`)
    },
    async session({ session, token }) {
      // Log session access for security monitoring
      if (process.env.NODE_ENV === 'production') {
        console.log(`Session accessed: ${session.user?.email}`)
      }
    }
  }
}