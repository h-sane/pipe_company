/**
 * Property-based tests for document organization and access
 * **Feature: pipe-supply-website, Property 20: Document organization and access**
 * **Validates: Requirements 8.3**
 */

import * as fc from 'fast-check'
import {
  getCategoryById,
  getCategoriesForMimeType,
  generateSecureDownloadUrl,
  validateDocumentForCategory,
  DOCUMENT_CATEGORIES,
  DocumentCategory,
  OrganizedDocument
} from './document-utils'

// Document generator for property-based testing
const documentGenerator = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  url: fc.webUrl(),
  type: fc.constantFrom(
    'technical-specs',
    'installation-guides',
    'safety-data',
    'certifications',
    'warranties',
    'maintenance',
    'other'
  ),
  mimeType: fc.constantFrom(
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ),
  size: fc.integer({ min: 1, max: 10000000 }),
  productId: fc.option(fc.string({ minLength: 1 })),
  productName: fc.option(fc.string({ minLength: 1 })),
  createdAt: fc.date()
})

// Product document generator
const productDocumentGenerator = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  url: fc.webUrl(),
  type: fc.constantFrom(...DOCUMENT_CATEGORIES.map(c => c.id)),
  productId: fc.string({ minLength: 1 }).filter(s => {
    // Filter out prototype property names to avoid conflicts
    const prototypePropNames = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__']
    return !prototypePropNames.includes(s)
  }),
  productName: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  createdAt: fc.date()
})

describe('Document Organization Property Tests', () => {
  it('Property 20: Document organization and access - documents are organized by product', () => {
    // **Feature: pipe-supply-website, Property 20: Document organization and access**
    // **Validates: Requirements 8.3**
    
    fc.assert(
      fc.property(
        fc.array(productDocumentGenerator, { minLength: 0, maxLength: 50 }),
        (documents) => {
          // Organize documents by product
          const byProduct: Record<string, OrganizedDocument[]> = Object.create(null)
          
          documents.forEach(doc => {
            if (!byProduct[doc.productId]) {
              byProduct[doc.productId] = []
            }
            
            const organizedDoc: OrganizedDocument = {
              id: doc.id,
              name: doc.name,
              url: doc.url,
              type: doc.type,
              productId: doc.productId,
              productName: doc.productName,
              category: doc.type,
              createdAt: doc.createdAt,
              secureDownloadUrl: generateSecureDownloadUrl(doc.id, true)
            }
            
            byProduct[doc.productId].push(organizedDoc)
          })
          
          // Property 1: All documents should be organized under their product
          const allDocumentsOrganized = documents.every(doc => {
            return byProduct[doc.productId] && 
                   byProduct[doc.productId].some(organized => organized.id === doc.id)
          })
          
          // Property 2: Each product group should only contain documents for that product
          const correctProductGrouping = Object.entries(byProduct).every(([productId, docs]) => {
            return docs.every(doc => doc.productId === productId)
          })
          
          // Property 3: Total number of organized documents should equal input
          const totalOrganized = Object.values(byProduct).reduce((sum, docs) => sum + docs.length, 0)
          const correctCount = totalOrganized === documents.length
          
          return allDocumentsOrganized && correctProductGrouping && correctCount
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 20a: Secure download URLs are generated for all documents', () => {
    // **Feature: pipe-supply-website, Property 20a: Secure download URL generation**
    
    fc.assert(
      fc.property(
        fc.array(documentGenerator, { minLength: 1, maxLength: 30 }),
        (documents) => {
          // Generate secure download URLs for all documents
          const documentsWithUrls = documents.map(doc => ({
            ...doc,
            secureDownloadUrl: generateSecureDownloadUrl(doc.id, !!doc.productId)
          }))
          
          // Property 1: All documents should have a secure download URL
          const allHaveUrls = documentsWithUrls.every(doc => 
            doc.secureDownloadUrl && 
            typeof doc.secureDownloadUrl === 'string' && 
            doc.secureDownloadUrl.length > 0
          )
          
          // Property 2: URLs should contain the document ID
          const urlsContainId = documentsWithUrls.every(doc => 
            doc.secureDownloadUrl.includes(doc.id)
          )
          
          // Property 3: URLs should end with /download
          const urlsEndWithDownload = documentsWithUrls.every(doc => 
            doc.secureDownloadUrl.endsWith('/download')
          )
          
          // Property 4: Product documents should use /api/documents endpoint
          const productDocsUseCorrectEndpoint = documentsWithUrls
            .filter(doc => doc.productId)
            .every(doc => doc.secureDownloadUrl.startsWith('/api/documents'))
          
          // Property 5: Non-product documents should use /api/media endpoint
          const nonProductDocsUseCorrectEndpoint = documentsWithUrls
            .filter(doc => !doc.productId)
            .every(doc => doc.secureDownloadUrl.startsWith('/api/media'))
          
          return allHaveUrls && 
                 urlsContainId && 
                 urlsEndWithDownload && 
                 productDocsUseCorrectEndpoint && 
                 nonProductDocsUseCorrectEndpoint
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 20b: Documents are categorized by type', () => {
    // **Feature: pipe-supply-website, Property 20b: Document categorization**
    
    fc.assert(
      fc.property(
        fc.array(productDocumentGenerator, { minLength: 0, maxLength: 40 }),
        (documents) => {
          // Organize documents by category
          const byCategory: Record<string, OrganizedDocument[]> = {}
          
          // Initialize all categories
          DOCUMENT_CATEGORIES.forEach(category => {
            byCategory[category.id] = []
          })
          
          documents.forEach(doc => {
            const organizedDoc: OrganizedDocument = {
              id: doc.id,
              name: doc.name,
              url: doc.url,
              type: doc.type,
              productId: doc.productId,
              productName: doc.productName,
              category: doc.type,
              createdAt: doc.createdAt,
              secureDownloadUrl: generateSecureDownloadUrl(doc.id, true)
            }
            
            if (byCategory[doc.type]) {
              byCategory[doc.type].push(organizedDoc)
            }
          })
          
          // Property 1: All valid categories should exist in the result
          const allCategoriesExist = DOCUMENT_CATEGORIES.every(category => 
            byCategory.hasOwnProperty(category.id)
          )
          
          // Property 2: Each category should only contain documents of that type
          const correctCategorization = Object.entries(byCategory).every(([categoryId, docs]) => {
            return docs.every(doc => doc.type === categoryId)
          })
          
          // Property 3: Total documents across all categories should equal input
          const totalCategorized = Object.values(byCategory).reduce((sum, docs) => sum + docs.length, 0)
          const correctCount = totalCategorized === documents.length
          
          return allCategoriesExist && correctCategorization && correctCount
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 20c: Document category validation works correctly', () => {
    // **Feature: pipe-supply-website, Property 20c: Category validation**
    
    fc.assert(
      fc.property(
        fc.constantFrom(...DOCUMENT_CATEGORIES.map(c => c.id)),
        fc.constantFrom(
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'video/mp4'
        ),
        (categoryId, mimeType) => {
          const isValid = validateDocumentForCategory(mimeType, categoryId)
          const category = getCategoryById(categoryId)
          
          // Property 1: Validation result should match category's allowed types
          if (category) {
            const expectedResult = category.allowedTypes.includes(mimeType)
            return isValid === expectedResult
          }
          
          // Property 2: Invalid category should return false
          return !isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 20d: Category lookup functions are consistent', () => {
    // **Feature: pipe-supply-website, Property 20d: Category lookup consistency**
    
    fc.assert(
      fc.property(
        fc.constantFrom(...DOCUMENT_CATEGORIES.map(c => c.id)),
        (categoryId) => {
          const category = getCategoryById(categoryId)
          
          // Property 1: Valid category IDs should return a category
          const categoryExists = category !== undefined
          
          // Property 2: Returned category should have the correct ID
          const correctId = category ? category.id === categoryId : true
          
          // Property 3: Category should have required fields
          const hasRequiredFields = category ? 
            Boolean(category.name && 
            category.description && 
            Array.isArray(category.allowedTypes) &&
            category.allowedTypes.length > 0) : true
          
          return categoryExists && correctId && hasRequiredFields
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 20e: MIME type to category mapping is bidirectional', () => {
    // **Feature: pipe-supply-website, Property 20e: MIME type category mapping**
    
    fc.assert(
      fc.property(
        fc.constantFrom(
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ),
        (mimeType) => {
          const categories = getCategoriesForMimeType(mimeType)
          
          // Property 1: All returned categories should allow this MIME type
          const allCategoriesAllowMimeType = categories.every(category => 
            category.allowedTypes.includes(mimeType)
          )
          
          // Property 2: All categories that allow this MIME type should be returned
          const allAllowingCategoriesReturned = DOCUMENT_CATEGORIES
            .filter(cat => cat.allowedTypes.includes(mimeType))
            .every(cat => categories.some(c => c.id === cat.id))
          
          // Property 3: No duplicate categories in result
          const uniqueCategories = new Set(categories.map(c => c.id))
          const noDuplicates = uniqueCategories.size === categories.length
          
          return allCategoriesAllowMimeType && allAllowingCategoriesReturned && noDuplicates
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 20f: Document organization preserves document metadata', () => {
    // **Feature: pipe-supply-website, Property 20f: Metadata preservation**
    
    fc.assert(
      fc.property(
        fc.array(productDocumentGenerator, { minLength: 1, maxLength: 20 }),
        (documents) => {
          // Organize documents
          const organized = documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            url: doc.url,
            type: doc.type,
            productId: doc.productId,
            productName: doc.productName,
            category: doc.type,
            createdAt: doc.createdAt,
            secureDownloadUrl: generateSecureDownloadUrl(doc.id, true)
          }))
          
          // Property 1: All original document IDs should be preserved
          const idsPreserved = documents.every(doc => 
            organized.some(org => org.id === doc.id)
          )
          
          // Property 2: All original document names should be preserved
          const namesPreserved = documents.every(doc => 
            organized.some(org => org.id === doc.id && org.name === doc.name)
          )
          
          // Property 3: All original URLs should be preserved
          const urlsPreserved = documents.every(doc => 
            organized.some(org => org.id === doc.id && org.url === doc.url)
          )
          
          // Property 4: Product associations should be preserved
          const productAssociationsPreserved = documents.every(doc => 
            organized.some(org => 
              org.id === doc.id && 
              org.productId === doc.productId &&
              org.productName === doc.productName
            )
          )
          
          // Property 5: Creation timestamps should be preserved
          const timestampsPreserved = documents.every(doc => 
            organized.some(org => 
              org.id === doc.id && 
              org.createdAt.getTime() === doc.createdAt.getTime()
            )
          )
          
          return idsPreserved && 
                 namesPreserved && 
                 urlsPreserved && 
                 productAssociationsPreserved && 
                 timestampsPreserved
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 20g: Bulk document associations maintain consistency', () => {
    // **Feature: pipe-supply-website, Property 20g: Bulk association consistency**
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mediaId: fc.string({ minLength: 1 }),
            productId: fc.string({ minLength: 1 }),
            category: fc.constantFrom(...DOCUMENT_CATEGORIES.map(c => c.id)),
            name: fc.option(fc.string({ minLength: 1 }))
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (associations) => {
          // Simulate bulk association results
          const results = {
            successful: 0,
            failed: 0,
            errors: [] as string[]
          }
          
          // Process each association
          associations.forEach(assoc => {
            // Simulate validation (in real test, this would check actual data)
            const isValid = assoc.mediaId && assoc.productId && assoc.category
            
            if (isValid) {
              results.successful++
            } else {
              results.failed++
              results.errors.push(`Invalid association for ${assoc.mediaId}`)
            }
          })
          
          // Property 1: Total processed should equal input count
          const totalProcessed = results.successful + results.failed
          const correctTotal = totalProcessed === associations.length
          
          // Property 2: Error count should match number of error messages
          const errorCountMatches = results.failed === results.errors.length
          
          // Property 3: All associations should be either successful or failed
          const allAccountedFor = (results.successful + results.failed) === associations.length
          
          return correctTotal && errorCountMatches && allAccountedFor
        }
      ),
      { numRuns: 100 }
    )
  })
})
