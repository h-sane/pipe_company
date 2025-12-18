import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

let handler

// FIX: Check if we are in the build phase
// If true, we assign a dummy handler that does nothing.
// If false (runtime), we initialize NextAuth normally.
if (process.env.NEXT_PHASE === 'phase-production-build') {
  handler = () => NextResponse.json({ message: 'Skipped during build' })
} else {
  handler = NextAuth(authOptions)
}

export { handler as GET, handler as POST }