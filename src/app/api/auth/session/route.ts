import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateSession, updateUserActivity } from '@/lib/session-utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }
    
    // Validate session and update activity
    const validation = await validateSession()
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 401 })
    }
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        permissions: session.user.permissions
      },
      expires: session.expires
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'Session validation failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }
    
    // Update user activity
    await updateUserActivity(session.user.id)
    
    return NextResponse.json({ success: true, message: 'Activity updated' })
  } catch (error) {
    console.error('Activity update error:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }
    
    // In a real application, you would invalidate the session here
    // For JWT sessions, the client needs to call signOut()
    
    return NextResponse.json({ success: true, message: 'Session invalidated' })
  } catch (error) {
    console.error('Session invalidation error:', error)
    return NextResponse.json({ error: 'Failed to invalidate session' }, { status: 500 })
  }
}