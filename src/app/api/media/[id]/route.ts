import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const media = await prisma.media.findUnique({
      where: { id: params.id }
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(media);

  } catch (error) {
    console.error('Media fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true, permissions: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'CONTENT_MANAGER' && !user.permissions.includes('MANAGE_MEDIA'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find media record
    const media = await prisma.media.findUnique({
      where: { id: params.id }
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete files from filesystem
    const filePath = join(UPLOAD_DIR, media.filename);
    const thumbnailPath = join(UPLOAD_DIR, `thumb_${media.filename}`);

    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
      if (existsSync(thumbnailPath)) {
        await unlink(thumbnailPath);
      }
    } catch (fileError) {
      console.warn('Failed to delete file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Media deleted successfully' });

  } catch (error) {
    console.error('Media deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}