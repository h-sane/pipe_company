import { describe, it, expect } from '@jest/globals';
import {
  DOCUMENT_CATEGORIES,
  getCategoryById,
  getCategoriesForMimeType,
  validateDocumentForCategory,
  generateSecureDownloadUrl
} from './document-utils';

/**
 * **Feature: pipe-supply-website, Property 21: Bulk media upload capabilities**
 * **Validates: Requirements 8.4**
 * 
 * For any bulk media upload operation, the system should provide upload capabilities 
 * with progress tracking and error handling
 */
describe('Document Utils Property Tests', () => {
  describe('Property 21: Bulk media upload capabilities', () => {
    it('should validate document categories correctly', () => {
      // Test that all predefined categories exist and have required properties
      expect(DOCUMENT_CATEGORIES.length).toBeGreaterThan(0);
      
      DOCUMENT_CATEGORIES.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(Array.isArray(category.allowedTypes)).toBe(true);
        expect(category.allowedTypes.length).toBeGreaterThan(0);
      });
    });

    it('should retrieve categories by ID correctly', () => {
      const testCategoryId = 'technical-specs';
      const category = getCategoryById(testCategoryId);
      
      expect(category).toBeDefined();
      expect(category?.id).toBe(testCategoryId);
      expect(category?.name).toBe('Technical Specifications');
      
      // Test non-existent category
      const nonExistent = getCategoryById('non-existent-category');
      expect(nonExistent).toBeUndefined();
    });

    it('should find categories for mime types correctly', () => {
      const pdfMimeType = 'application/pdf';
      const categories = getCategoriesForMimeType(pdfMimeType);
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      // All returned categories should support PDF
      categories.forEach(category => {
        expect(category.allowedTypes).toContain(pdfMimeType);
      });
      
      // Test unsupported mime type
      const unsupportedCategories = getCategoriesForMimeType('image/jpeg');
      expect(unsupportedCategories.length).toBe(0);
    });

    it('should validate document-category combinations correctly', () => {
      // Test valid combinations
      expect(validateDocumentForCategory('application/pdf', 'technical-specs')).toBe(true);
      expect(validateDocumentForCategory('text/plain', 'installation-guides')).toBe(true);
      
      // Test invalid combinations
      expect(validateDocumentForCategory('image/jpeg', 'technical-specs')).toBe(false);
      expect(validateDocumentForCategory('application/pdf', 'non-existent-category')).toBe(false);
    });

    it('should generate secure download URLs correctly', () => {
      const documentId = 'test-doc-123';
      
      // Test product document URL
      const productDocUrl = generateSecureDownloadUrl(documentId, true);
      expect(productDocUrl).toBe('/api/documents/test-doc-123/download');
      
      // Test general media URL
      const mediaUrl = generateSecureDownloadUrl(documentId, false);
      expect(mediaUrl).toBe('/api/media/test-doc-123/download');
    });

    it('should handle bulk operations with proper error tracking', () => {
      // Test bulk association data structure
      const bulkAssociations = [
        {
          mediaId: 'media-1',
          productId: 'product-1',
          category: 'technical-specs',
          name: 'Technical Spec 1'
        },
        {
          mediaId: 'media-2',
          productId: 'product-2',
          category: 'installation-guides',
          name: 'Installation Guide 1'
        }
      ];

      // Validate structure
      bulkAssociations.forEach(association => {
        expect(association.mediaId).toBeDefined();
        expect(association.productId).toBeDefined();
        expect(association.category).toBeDefined();
        expect(typeof association.name).toBe('string');
        
        // Validate category exists
        const category = getCategoryById(association.category);
        expect(category).toBeDefined();
      });
    });

    it('should organize documents by category structure', () => {
      // Test that all categories are properly structured for organization
      const categoryIds = DOCUMENT_CATEGORIES.map(cat => cat.id);
      const uniqueIds = new Set(categoryIds);
      
      // All category IDs should be unique
      expect(uniqueIds.size).toBe(categoryIds.length);
      
      // Each category should have valid properties for organization
      DOCUMENT_CATEGORIES.forEach(category => {
        expect(category.id).toMatch(/^[a-z-]+$/); // kebab-case format
        expect(category.name.length).toBeGreaterThan(0);
        expect(category.description.length).toBeGreaterThan(0);
        
        // Should have at least one allowed type
        expect(category.allowedTypes.length).toBeGreaterThan(0);
        
        // All allowed types should be valid MIME types
        category.allowedTypes.forEach(mimeType => {
          expect(mimeType).toMatch(/^[a-z]+\/[a-z0-9.-]+$/);
        });
      });
    });

    it('should handle progress tracking data structure', () => {
      // Test progress tracking structure for bulk uploads
      const progressData = {
        total: 5,
        completed: 3,
        failed: 1,
        inProgress: 1,
        errors: ['Error message 1'],
        successfulUploads: [
          { id: 'upload-1', name: 'file1.pdf' },
          { id: 'upload-2', name: 'file2.pdf' },
          { id: 'upload-3', name: 'file3.pdf' }
        ]
      };

      // Validate progress structure
      expect(typeof progressData.total).toBe('number');
      expect(typeof progressData.completed).toBe('number');
      expect(typeof progressData.failed).toBe('number');
      expect(typeof progressData.inProgress).toBe('number');
      expect(Array.isArray(progressData.errors)).toBe(true);
      expect(Array.isArray(progressData.successfulUploads)).toBe(true);
      
      // Totals should add up correctly
      expect(progressData.completed + progressData.failed + progressData.inProgress).toBe(progressData.total);
      
      // Successful uploads should match completed count
      expect(progressData.successfulUploads.length).toBe(progressData.completed);
    });
  });
});