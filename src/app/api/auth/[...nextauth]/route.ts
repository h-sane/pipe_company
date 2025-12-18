import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// We use 'require' inside the handler to ensure NO imports happen at the top level
// This prevents the build server from even seeing the NextAuth library
const handler = async (req: any, ctx: any) => {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ message: 'Skipped' });
  }

  const NextAuth = require("next-auth").default;
  const { authOptions } = require("@/lib/auth");
  
  return NextAuth(authOptions)(req, ctx);
}

export { handler as GET, handler as POST };