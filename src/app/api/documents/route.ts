import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication for document access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const category = searchParams.get('category'); // 'technical', 'specification', 'manual', etc.
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      type: 'DOCUMENT'
    };

    // If productId is specified, get documents for that product
    if (productId) {
      const productDocuments = await prisma.productDocument.findMany({
        where: { productId },
        include: {
          product: {
            select: { name: true, category: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const total = await prisma.productDocument.count({
        where: { productId }
      });

      return NextResponse.json({
        documents: productDocuments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Get general media documents
    const [documents, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.media.count({ where })
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true, permissions: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'CONTENT_MANAGER' && !user.permissions.includes('MANAGE_MEDIA'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { mediaId, productId, category, description } = body;

    if (!mediaId || !productId) {
      return NextResponse.json({ 
        error: 'Media ID and Product ID are required' 
      }, { status: 400 });
    }

    // Verify media exists and is a document
    const media = await prisma.media.findUnique({
      where: { id: mediaId }
    });

    if (!media || media.type !== 'DOCUMENT') {
      return NextResponse.json({ 
        error: 'Invalid media ID or media is not a document' 
      }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    // Create product document association
    const productDocument = await prisma.productDocument.create({
      data: {
        name: media.originalName,
        url: media.url,
        type: category || 'general',
        productId,
        // Note: We could extend the schema to link to media table if needed
      },
      include: {
        product: {
          select: { name: true, category: true }
        }
      }
    });

    return NextResponse.json({
      id: productDocument.id,
      name: productDocument.name,
      url: productDocument.url,
      type: productDocument.type,
      product: productDocument.product,
      createdAt: productDocument.createdAt
    });

  } catch (error) {
    console.error('Document association error:', error);
    return NextResponse.json(
      { error: 'Failed to associate document with product' },
      { status: 500 }
    );
  }
}