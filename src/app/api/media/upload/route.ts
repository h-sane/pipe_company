import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Validate file type and size
function validateFile(file: File, type: 'image' | 'document') {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed for ${type} uploads`);
  }
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
}

// Process and optimize image
async function processImage(buffer: Buffer, filename: string): Promise<{ optimized: Buffer; thumbnail: Buffer }> {
  const optimized = Buffer.from(await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer());

  const thumbnail = Buffer.from(await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer());

  return { optimized, thumbnail };
}

export async function POST(request: NextRequest) {
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

    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' or 'document'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['image', 'document'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "image" or "document"' }, { status: 400 });
    }

    // Validate file
    validateFile(file, type as 'image' | 'document');

    const buffer = Buffer.from(await file.arrayBuffer() as any);
    const filename = generateFilename(file.name);
    const filePath = join(UPLOAD_DIR, filename);

    let finalBuffer = buffer;
    let thumbnailPath: string | null = null;

    // Process images
    if (type === 'image') {
      const { optimized, thumbnail } = await processImage(buffer, filename);
      finalBuffer = optimized;

      // Save thumbnail
      const thumbnailFilename = `thumb_${filename}`;
      thumbnailPath = join(UPLOAD_DIR, thumbnailFilename);
      await writeFile(thumbnailPath, thumbnail);
    }

    // Save main file
    await writeFile(filePath, finalBuffer);

    // Save to database
    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        url: `/uploads/${filename}`,
        mimeType: file.type,
        size: finalBuffer.length,
        type: type === 'image' ? 'IMAGE' : 'DOCUMENT'
      }
    });

    return NextResponse.json({
      id: media.id,
      url: media.url,
      filename: media.filename,
      originalName: media.originalName,
      size: media.size,
      type: media.type,
      thumbnailUrl: thumbnailPath ? `/uploads/thumb_${filename}` : null
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}