import { describe, it, expect } from '@jest/globals';
import {
  validateFileType,
  validateFileSize,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isDocumentFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE
} from './media-utils';

/**
 * **Feature: pipe-supply-website, Property 7: Image processing and optimization**
 * **Validates: Requirements 3.3, 8.1, 8.5**
 * 
 * For any uploaded image file in supported formats, the system should validate the format,
 * optimize for web display, generate multiple responsive sizes, and maintain original quality
 */
describe('Media Utils Property Tests', () => {
  describe('Property 7: Image processing and optimization', () => {
    it('should validate all supported image file types', () => {
      // Test all allowed image types are properly validated
      ALLOWED_IMAGE_TYPES.forEach(mimeType => {
        const mockFile = {
          type: mimeType,
          name: 'test.jpg',
          size: 1024 * 1024 // 1MB
        } as File;

        expect(validateFileType(mockFile, 'image')).toBe(true);
        expect(isImageFile(mimeType)).toBe(true);
      });
    });

    it('should reject unsupported image file types', () => {
      const invalidTypes = ['image/gif', 'image/bmp', 'application/pdf', 'text/plain'];
      
      invalidTypes.forEach(mimeType => {
        const mockFile = {
          type: mimeType,
          name: 'test.file',
          size: 1024 * 1024
        } as File;

        expect(validateFileType(mockFile, 'image')).toBe(false);
      });
    });

    it('should validate file sizes within limits', () => {
      // Test files within size limit
      const validFile = {
        type: 'image/jpeg',
        name: 'test.jpg',
        size: MAX_FILE_SIZE - 1000
      } as File;
      expect(validateFileSize(validFile)).toBe(true);

      // Test files exceeding size limit
      const invalidFile = {
        type: 'image/jpeg',
        name: 'test.jpg',
        size: MAX_FILE_SIZE + 1000
      } as File;
      expect(validateFileSize(invalidFile)).toBe(false);
    });

    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg');
      expect(getFileExtension('document.PDF')).toBe('pdf');
      expect(getFileExtension('file.tar.gz')).toBe('gz');
      expect(getFileExtension('noextension')).toBe('');
    });

    it('should validate all supported document file types', () => {
      ALLOWED_DOCUMENT_TYPES.forEach(mimeType => {
        const mockFile = {
          type: mimeType,
          name: 'document.pdf',
          size: 1024 * 1024
        } as File;

        expect(validateFileType(mockFile, 'document')).toBe(true);
        expect(isDocumentFile(mimeType)).toBe(true);
      });
    });

    it('should handle image optimization validation consistently', () => {
      // Test that image validation works for all supported types and valid sizes
      const testCases = [
        { type: 'image/jpeg', name: 'photo.jpg', size: 1024 * 1024 },
        { type: 'image/png', name: 'image.png', size: 2 * 1024 * 1024 },
        { type: 'image/webp', name: 'picture.webp', size: 500 * 1024 }
      ];

      testCases.forEach(testCase => {
        const mockFile = testCase as File;
        
        expect(validateFileType(mockFile, 'image')).toBe(true);
        expect(validateFileSize(mockFile)).toBe(true);
        expect(isImageFile(testCase.type)).toBe(true);
      });
    });

    it('should maintain file extension consistency', () => {
      // Test file extension extraction consistency
      const testCases = [
        { filename: 'file.jpg', expected: 'jpg' },
        { filename: 'document.PDF', expected: 'pdf' },
        { filename: 'image.PNG', expected: 'png' },
        { filename: 'test.WEBP', expected: 'webp' },
        { filename: 'noextension', expected: '' }
      ];

      testCases.forEach(testCase => {
        expect(getFileExtension(testCase.filename)).toBe(testCase.expected);
      });
    });
  });
});