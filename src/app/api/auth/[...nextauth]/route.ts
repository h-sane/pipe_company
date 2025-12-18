import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 1. We define the handler to load everything dynamically.
// This ensures the build server sees this file as "empty" of dependencies.
const handler = async (req: Request, ctx: any) => {
  // 2. We import the options AND the library only when a request actually happens
  const { default: NextAuth } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  
  // 3. Initialize and execute
  // @ts-ignore
  return NextAuth(authOptions)(req, ctx);
}

export { handler as GET, handler as POST };