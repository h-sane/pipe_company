import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// POST /api/media/upload - Upload media file (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // For MVP, return mock response
    const mockMedia = {
      id: 'mock-media-id',
      filename: 'uploaded-file.jpg',
      originalName: 'original-file.jpg',
      mimeType: 'image/jpeg',
      size: 1024000,
      url: '/uploads/mock-file.jpg',
      type: 'IMAGE',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return NextResponse.json(mockMedia, { status: 201 })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}