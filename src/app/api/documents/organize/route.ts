import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizeDocumentsByProduct, organizeGeneralDocuments, DOCUMENT_CATEGORIES } from '@/lib/document-utils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type') || 'product'; // 'product' or 'general'

    if (type === 'general') {
      const organized = await organizeGeneralDocuments();
      return NextResponse.json({
        type: 'general',
        data: organized,
        categories: DOCUMENT_CATEGORIES
      });
    } else {
      const organized = await organizeDocumentsByProduct(productId || undefined);
      return NextResponse.json({
        type: 'product',
        productId,
        data: organized,
        categories: DOCUMENT_CATEGORIES
      });
    }

  } catch (error) {
    console.error('Document organization error:', error);
    return NextResponse.json(
      { error: 'Failed to organize documents' },
      { status: 500 }
    );
  }
}