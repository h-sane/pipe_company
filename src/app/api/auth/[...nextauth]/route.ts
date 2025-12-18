import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handler(req: any, ctx: any) {
  try {
    // We try to load NextAuth dynamically
    const NextAuth = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    
    // @ts-ignore
    return NextAuth.default(authOptions)(req, ctx);
  } catch (error) {
    // IF IT CRASHES (like during build), we catch it and return a dummy response
    console.error("Auth load failed (expected during build):", error);
    return NextResponse.json({ message: "Auth unavailable during build" }, { status: 200 });
  }
}

export { handler as GET, handler as POST };