import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// GET /api/media/[id]/download - Download media file (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession(req)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const media = await prisma.media.findUnique({
      where: { id: params.id }
    })
    
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }
    
    // For MVP, return redirect to media URL
    return NextResponse.redirect(media.url)
  } catch (error) {
    console.error('Error downloading media:', error)
    return NextResponse.json(
      { error: 'Failed to download media' },
      { status: 500 }
    )
  }
}