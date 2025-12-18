import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// Force this route to be dynamic to skip static generation
export const dynamic = "force-dynamic";

// Helper function to load NextAuth only at runtime
async function handleRequest(req: any, ctx: any) {
  // DYNAMIC IMPORT: This prevents the library from loading during build
  const { default: NextAuth } = await import("next-auth");
  return NextAuth(authOptions)(req, ctx);
}

// Export individual handlers instead of the shorthand
export async function GET(req: any, ctx: any) {
  return handleRequest(req, ctx);
}

export async function POST(req: any, ctx: any) {
  return handleRequest(req, ctx);
}