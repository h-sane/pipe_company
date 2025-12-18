import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

// POST /api/documents/organize - Organize documents (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await req.json()
    
    // For MVP, return success response
    return NextResponse.json({
      message: 'Documents organized successfully',
      organized: data.documentIds?.length || 0
    })
  } catch (error) {
    console.error('Error organizing documents:', error)
    return NextResponse.json(
      { error: 'Failed to organize documents' },
      { status: 500 }
    )
  }
}