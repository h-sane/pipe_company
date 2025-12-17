import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication for document downloads
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find product document record
    const productDocument = await prisma.productDocument.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: { name: true, category: true }
        }
      }
    });

    if (!productDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // For product documents, the URL might be a direct file path or a media reference
    let filePath: string;
    let fileName: string = productDocument.name;
    let mimeType: string = 'application/octet-stream';

    if (productDocument.url.startsWith('/uploads/')) {
      // Direct file reference
      const filename = productDocument.url.replace('/uploads/', '');
      filePath = join(UPLOAD_DIR, filename);
    } else {
      // Try to find associated media
      const media = await prisma.media.findFirst({
        where: { 
          url: productDocument.url,
          type: 'DOCUMENT'
        }
      });

      if (media) {
        filePath = join(UPLOAD_DIR, media.filename);
        mimeType = media.mimeType;
        fileName = media.originalName;
      } else {
        return NextResponse.json({ error: 'Document file not found' }, { status: 404 });
      }
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Cache-Control', 'private, no-cache');
    
    // Add product context headers for tracking
    headers.set('X-Product-Name', productDocument.product.name);
    headers.set('X-Document-Type', productDocument.type);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}