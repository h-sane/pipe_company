import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bulkAssociateDocuments } from '@/lib/document-utils';

export const dynamic = 'force-dynamic'

interface BulkAssociationRequest {
  associations: Array<{
    mediaId: string;
    productId: string;
    category: string;
    name?: string;
  }>;
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

    const body: BulkAssociationRequest = await request.json();
    
    if (!body.associations || !Array.isArray(body.associations) || body.associations.length === 0) {
      return NextResponse.json({ 
        error: 'Associations array is required and must not be empty' 
      }, { status: 400 });
    }

    // Validate each association has required fields
    for (const association of body.associations) {
      if (!association.mediaId || !association.productId || !association.category) {
        return NextResponse.json({ 
          error: 'Each association must have mediaId, productId, and category' 
        }, { status: 400 });
      }
    }

    // Process bulk associations
    const results = await bulkAssociateDocuments(body.associations);

    return NextResponse.json({
      summary: {
        total: body.associations.length,
        successful: results.successful,
        failed: results.failed
      },
      errors: results.errors,
      message: `Successfully associated ${results.successful} documents. ${results.failed} failed.`
    });

  } catch (error) {
    console.error('Bulk document association error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk document associations' },
      { status: 500 }
    );
  }
}