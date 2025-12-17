import { prisma } from './prisma';

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  allowedTypes: string[];
}

export interface OrganizedDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  mimeType?: string;
  productId?: string;
  productName?: string;
  category: string;
  createdAt: Date;
  secureDownloadUrl: string;
}

// Predefined document categories for pipe supply business
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'technical-specs',
    name: 'Technical Specifications',
    description: 'Detailed technical specifications and engineering drawings',
    allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  },
  {
    id: 'installation-guides',
    name: 'Installation Guides',
    description: 'Step-by-step installation and setup instructions',
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    id: 'safety-data',
    name: 'Safety Data Sheets',
    description: 'Material safety data sheets and compliance documents',
    allowedTypes: ['application/pdf']
  },
  {
    id: 'certifications',
    name: 'Certifications',
    description: 'Quality certifications and compliance certificates',
    allowedTypes: ['application/pdf']
  },
  {
    id: 'warranties',
    name: 'Warranty Information',
    description: 'Warranty terms and conditions',
    allowedTypes: ['application/pdf', 'text/plain']
  },
  {
    id: 'maintenance',
    name: 'Maintenance Guides',
    description: 'Maintenance schedules and procedures',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
];

export function getCategoryById(categoryId: string): DocumentCategory | undefined {
  return DOCUMENT_CATEGORIES.find(cat => cat.id === categoryId);
}

export function getCategoriesForMimeType(mimeType: string): DocumentCategory[] {
  return DOCUMENT_CATEGORIES.filter(cat => 
    cat.allowedTypes.includes(mimeType)
  );
}

export function generateSecureDownloadUrl(documentId: string, isProductDocument: boolean = false): string {
  const baseUrl = isProductDocument ? '/api/documents' : '/api/media';
  return `${baseUrl}/${documentId}/download`;
}

export async function organizeDocumentsByProduct(productId?: string): Promise<{
  byCategory: Record<string, OrganizedDocument[]>;
  uncategorized: OrganizedDocument[];
  total: number;
}> {
  try {
    let documents: any[] = [];

    if (productId) {
      // Get documents for specific product
      documents = await prisma.productDocument.findMany({
        where: { productId },
        include: {
          product: {
            select: { name: true, category: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Get all product documents
      documents = await prisma.productDocument.findMany({
        include: {
          product: {
            select: { name: true, category: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    const organized: Record<string, OrganizedDocument[]> = {};
    const uncategorized: OrganizedDocument[] = [];

    // Initialize categories
    DOCUMENT_CATEGORIES.forEach(category => {
      organized[category.id] = [];
    });

    documents.forEach(doc => {
      const organizedDoc: OrganizedDocument = {
        id: doc.id,
        name: doc.name,
        url: doc.url,
        type: doc.type,
        productId: doc.productId,
        productName: doc.product.name,
        category: doc.type,
        createdAt: doc.createdAt,
        secureDownloadUrl: generateSecureDownloadUrl(doc.id, true)
      };

      // Try to categorize based on document type
      const category = getCategoryById(doc.type);
      if (category) {
        organized[doc.type].push(organizedDoc);
      } else {
        uncategorized.push(organizedDoc);
      }
    });

    return {
      byCategory: organized,
      uncategorized,
      total: documents.length
    };

  } catch (error) {
    console.error('Error organizing documents:', error);
    throw new Error('Failed to organize documents');
  }
}

export async function organizeGeneralDocuments(): Promise<{
  byType: Record<string, OrganizedDocument[]>;
  total: number;
}> {
  try {
    const documents = await prisma.media.findMany({
      where: { type: 'DOCUMENT' },
      orderBy: { createdAt: 'desc' }
    });

    const byType: Record<string, OrganizedDocument[]> = {};

    documents.forEach((doc: any) => {
      const organizedDoc: OrganizedDocument = {
        id: doc.id,
        name: doc.originalName,
        url: doc.url,
        type: 'general',
        size: doc.size,
        mimeType: doc.mimeType,
        category: 'general',
        createdAt: doc.createdAt,
        secureDownloadUrl: generateSecureDownloadUrl(doc.id, false)
      };

      if (!byType[doc.mimeType]) {
        byType[doc.mimeType] = [];
      }
      byType[doc.mimeType].push(organizedDoc);
    });

    return {
      byType,
      total: documents.length
    };

  } catch (error) {
    console.error('Error organizing general documents:', error);
    throw new Error('Failed to organize general documents');
  }
}

export function validateDocumentForCategory(mimeType: string, categoryId: string): boolean {
  const category = getCategoryById(categoryId);
  return category ? category.allowedTypes.includes(mimeType) : false;
}

export async function bulkAssociateDocuments(associations: Array<{
  mediaId: string;
  productId: string;
  category: string;
  name?: string;
}>): Promise<{
  successful: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const association of associations) {
    try {
      // Verify media exists and is a document
      const media = await prisma.media.findUnique({
        where: { id: association.mediaId }
      });

      if (!media || media.type !== 'DOCUMENT') {
        results.failed++;
        results.errors.push(`Invalid media ID: ${association.mediaId}`);
        continue;
      }

      // Verify product exists
      const product = await prisma.product.findUnique({
        where: { id: association.productId }
      });

      if (!product) {
        results.failed++;
        results.errors.push(`Product not found: ${association.productId}`);
        continue;
      }

      // Validate category
      if (!validateDocumentForCategory(media.mimeType, association.category)) {
        results.failed++;
        results.errors.push(`Invalid category ${association.category} for file type ${media.mimeType}`);
        continue;
      }

      // Create association
      await prisma.productDocument.create({
        data: {
          name: association.name || media.originalName,
          url: media.url,
          type: association.category,
          productId: association.productId
        }
      });

      results.successful++;

    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to associate ${association.mediaId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
}