/**
 * Tests for product validation utilities
 */

import { validateProductData, sanitizeProductData, createAuditLogEntry, formatValidationErrors } from './product-validation'

describe('Product Validation', () => {
  describe('validateProductData', () => {
    it('should validate required fields for creation', () => {
      const invalidData = {
        name: 'Test Product'
        // Missing required fields
      }
      
      const result = validateProductData(invalidData, false)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.code === 'REQUIRED_FIELD_MISSING')).toBe(true)
    })
    
    it('should validate complete product data', () => {
      const validData = {
        name: 'Steel Pipe 6"',
        description: 'High quality steel pipe',
        category: 'STEEL_PIPE',
        brand: 'AcmePipe',
        diameter: '6 inches',
        length: '10 feet',
        material: 'Carbon Steel',
        pressureRating: '150 PSI',
        temperature: '200°F',
        basePrice: 99.99,
        pricePerUnit: 'per foot',
        standards: ['ASTM A53'],
        applications: ['Plumbing', 'Industrial']
      }
      
      const result = validateProductData(validData, false)
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })
    
    it('should validate price constraints', () => {
      const invalidData = {
        name: 'Test Product',
        basePrice: -10 // Invalid negative price
      }
      
      const result = validateProductData(invalidData, true)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'NEGATIVE_PRICE')).toBe(true)
    })
    
    it('should validate bulk discounts', () => {
      const invalidData = {
        bulkDiscounts: [
          { minQuantity: 0, discount: 0.1 }, // Invalid minQuantity
          { minQuantity: 10, discount: 1.5 } // Invalid discount > 1
        ]
      }
      
      const result = validateProductData(invalidData, true)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_MIN_QUANTITY')).toBe(true)
      expect(result.errors.some(e => e.code === 'INVALID_DISCOUNT')).toBe(true)
    })
  })
  
  describe('sanitizeProductData', () => {
    it('should trim string fields', () => {
      const data = {
        name: '  Test Product  ',
        brand: '  AcmePipe  ',
        standards: ['  ASTM A53  ', '  ISO 9001  ']
      }
      
      const sanitized = sanitizeProductData(data)
      expect(sanitized.name).toBe('Test Product')
      expect(sanitized.brand).toBe('AcmePipe')
      expect(sanitized.standards).toEqual(['ASTM A53', 'ISO 9001'])
    })
    
    it('should filter empty strings from arrays', () => {
      const data = {
        standards: ['ASTM A53', '  ', '', 'ISO 9001'],
        applications: ['Plumbing', '', '  ', 'Industrial']
      }
      
      const sanitized = sanitizeProductData(data)
      expect(sanitized.standards).toEqual(['ASTM A53', 'ISO 9001'])
      expect(sanitized.applications).toEqual(['Plumbing', 'Industrial'])
    })
  })
  
  describe('createAuditLogEntry', () => {
    it('should create audit log for product creation', () => {
      const productData = {
        id: 'prod-123',
        name: 'Test Product',
        basePrice: 99.99
      }
      
      const auditEntry = createAuditLogEntry(
        'prod-123',
        'CREATE',
        'user-456',
        null,
        productData,
        { ipAddress: '192.168.1.1' }
      )
      
      expect(auditEntry.productId).toBe('prod-123')
      expect(auditEntry.action).toBe('CREATE')
      expect(auditEntry.userId).toBe('user-456')
      expect(auditEntry.changes.name.from).toBeNull()
      expect(auditEntry.changes.name.to).toBe('Test Product')
      expect(auditEntry.ipAddress).toBe('192.168.1.1')
    })
    
    it('should create audit log for product update', () => {
      const oldData = { name: 'Old Name', basePrice: 50.00 }
      const newData = { name: 'New Name', basePrice: 75.00 }
      
      const auditEntry = createAuditLogEntry(
        'prod-123',
        'UPDATE',
        'user-456',
        oldData,
        newData
      )
      
      expect(auditEntry.changes.name.from).toBe('Old Name')
      expect(auditEntry.changes.name.to).toBe('New Name')
      expect(auditEntry.changes.basePrice.from).toBe(50.00)
      expect(auditEntry.changes.basePrice.to).toBe(75.00)
    })
  })
  
  describe('formatValidationErrors', () => {
    it('should format single error', () => {
      const errors = [
        { field: 'name', message: 'Name is required', code: 'REQUIRED_FIELD_MISSING' }
      ]
      
      const formatted = formatValidationErrors(errors)
      expect(formatted).toBe('Name is required')
    })
    
    it('should format multiple errors', () => {
      const errors = [
        { field: 'name', message: 'Name is required', code: 'REQUIRED_FIELD_MISSING' },
        { field: 'price', message: 'Price must be positive', code: 'NEGATIVE_PRICE' }
      ]
      
      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('Multiple validation errors')
      expect(formatted).toContain('name: Name is required')
      expect(formatted).toContain('price: Price must be positive')
    })
  })
})