import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

let handler

try {
  // Try to initialize NextAuth
  handler = NextAuth(authOptions)
} catch (error) {
  // If it crashes during build (ENOENT), we ignore it and use a dummy handler
  console.warn('NextAuth init failed (expected during build):', error)
  handler = () => NextResponse.json({ error: 'Auth not available during build' })
}

export { handler as GET, handler as POST }