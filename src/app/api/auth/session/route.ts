import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req)
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    return NextResponse.json({ user: session.user }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 })
  }
}