import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

// FIX: We define the handler as a wrapper function.
// This prevents NextAuth from initializing during the build.
// It will only initialize when a real request comes in.
const handler = async (req: any, ctx: any) => {
  return await NextAuth(authOptions)(req, ctx)
}

export { handler as GET, handler as POST }