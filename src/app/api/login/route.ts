import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email, password } = await req.json()
  
  // MVP: Hardcoded admin credentials
  if (email === "admin@pipe.com" && password === "admin123") {
    const res = NextResponse.json({ success: true })
    res.cookies.set("session", "admin", { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 hours
    })
    return res
  }
  
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
}