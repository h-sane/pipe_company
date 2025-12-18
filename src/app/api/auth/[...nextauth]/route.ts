import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handler(req: any, ctx: any) {
  // 1. Safety check for build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ message: "Skipped" });
  }

  try {
    // 2. Dynamic import wrapped in try-catch
    // This protects against the CSS error crashing the whole route
    const NextAuthModule = await import("next-auth");
    const AuthConfig = await import("@/lib/auth");
    
    // @ts-ignore
    const nextAuthHandler = NextAuthModule.default(AuthConfig.authOptions);
    return await nextAuthHandler(req, ctx);
  } catch (error) {
    console.error("NextAuth failed to load (likely build-time CSS error):", error);
    // Return a valid response so build doesn't fail
    return NextResponse.json({ error: "Auth unavailable" }, { status: 500 });
  }
}

export { handler as GET, handler as POST };