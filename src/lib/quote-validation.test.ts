import * as fc from 'fast-check'
import { 
  validateQuoteRequest, 
  sanitizeQuoteRequest, 
  validateQuoteStatus,
  formatValidationErrors 
} from './quote-validation'

/**
 * **Feature: pipe-supply-website, Property 5: Quote submission integrity**
 * **Validates: Requirements 2.2, 2.3, 2.5**
 */

// Generators for property-based testing
const validEmailGenerator = fc.emailAddress()

const validQuoteProductGenerator = fc.record({
  productId: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2 && /[a-zA-Z0-9]/.test(s)),
  quantity: fc.integer({ min: 1, max: 10000 }),
  notes: fc.option(fc.string({ maxLength: 500 }))
})

const validQuoteRequestGenerator = fc.record({
  customerName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /[a-zA-Z0-9]/.test(s)),
  customerEmail: validEmailGenerator,
  customerPhone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
  company: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  address: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
  city: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  state: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  zipCode: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  country: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  message: fc.option(fc.string({ maxLength: 1000 })),
  products: fc.array(validQuoteProductGenerator, { minLength: 1, maxLength: 10 })
})

const invalidQuoteRequestGenerator = fc.oneof(
  // Missing required fields
  fc.record({
    customerEmail: validEmailGenerator,
    products: fc.array(validQuoteProductGenerator, { minLength: 1 })
  }),
  fc.record({
    customerName: fc.string({ minLength: 1 }),
    products: fc.array(validQuoteProductGenerator, { minLength: 1 })
  }),
  fc.record({
    customerName: fc.string({ minLength: 1 }),
    customerEmail: validEmailGenerator
  }),
  // Invalid email format
  fc.record({
    customerName: fc.string({ minLength: 1 }),
    customerEmail: fc.string().filter(s => !s.includes('@')),
    products: fc.array(validQuoteProductGenerator, { minLength: 1 })
  }),
  // Empty products array
  fc.record({
    customerName: fc.string({ minLength: 1 }),
    customerEmail: validEmailGenerator,
    products: fc.constant([])
  }),
  // Invalid product data
  fc.record({
    customerName: fc.string({ minLength: 1 }),
    customerEmail: validEmailGenerator,
    products: fc.array(fc.record({
      productId: fc.string({ minLength: 1 }),
      quantity: fc.integer({ max: 0 }) // Invalid quantity
    }), { minLength: 1 })
  })
)

describe('Quote Validation Property Tests', () => {
  describe('Property 5: Quote submission integrity', () => {
    test('valid quote requests should always pass validation', () => {
      fc.assert(fc.property(validQuoteRequestGenerator, (quoteData) => {
        const sanitized = sanitizeQuoteRequest(quoteData)
        const validation = validateQuoteRequest(sanitized)
        
        expect(validation.isValid).toBe(true)
        expect(validation.errors).toHaveLength(0)
        
        // Verify required fields are preserved
        expect(sanitized.customerName).toBeTruthy()
        expect(sanitized.customerEmail).toBeTruthy()
        expect(sanitized.products).toBeTruthy()
        expect(sanitized.products.length).toBeGreaterThan(0)
        
        // Verify email format is maintained
        expect(sanitized.customerEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        
        // Verify all products have valid data
        sanitized.products.forEach(product => {
          expect(product.productId).toBeTruthy()
          expect(product.quantity).toBeGreaterThan(0)
        })
      }), { numRuns: 100 })
    })

    test('invalid quote requests should always fail validation', () => {
      fc.assert(fc.property(invalidQuoteRequestGenerator, (quoteData) => {
        const sanitized = sanitizeQuoteRequest(quoteData)
        const validation = validateQuoteRequest(sanitized)
        
        expect(validation.isValid).toBe(false)
        expect(validation.errors.length).toBeGreaterThan(0)
        
        // Verify error messages are meaningful
        const errorMessage = formatValidationErrors(validation.errors)
        expect(errorMessage).toBeTruthy()
        expect(typeof errorMessage).toBe('string')
      }), { numRuns: 100 })
    })

    test('sanitization should prevent XSS attacks', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>'
      ]

      fc.assert(fc.property(
        validQuoteRequestGenerator,
        fc.constantFrom(...xssPayloads),
        (quoteData, xssPayload) => {
          const maliciousData = {
            ...quoteData,
            customerName: xssPayload,
            message: xssPayload,
            company: xssPayload
          }
          
          const sanitized = sanitizeQuoteRequest(maliciousData)
          
          // Verify XSS payloads are neutralized
          expect(sanitized.customerName).not.toContain('<')
          expect(sanitized.customerName).not.toContain('>')
          if (sanitized.message) {
            expect(sanitized.message).not.toContain('<')
            expect(sanitized.message).not.toContain('>')
          }
          if (sanitized.company) {
            expect(sanitized.company).not.toContain('<')
            expect(sanitized.company).not.toContain('>')
          }
        }
      ), { numRuns: 50 })
    })

    test('duplicate submissions should be detectable by comparing product arrays', () => {
      fc.assert(fc.property(validQuoteRequestGenerator, (quoteData) => {
        const sanitized1 = sanitizeQuoteRequest(quoteData)
        const sanitized2 = sanitizeQuoteRequest(quoteData)
        
        // Extract product IDs for comparison
        const productIds1 = sanitized1.products.map(p => p.productId).sort()
        const productIds2 = sanitized2.products.map(p => p.productId).sort()
        
        // Same data should produce identical product ID arrays
        expect(JSON.stringify(productIds1)).toBe(JSON.stringify(productIds2))
      }), { numRuns: 100 })
    })

    test('quote status validation should accept only valid statuses', () => {
      const validStatuses = ['PENDING', 'RESPONDED', 'CLOSED', 'CANCELLED']
      const invalidStatuses = ['INVALID', 'PROCESSING', 'DRAFT', '', 'pending', 'Pending']
      
      validStatuses.forEach(status => {
        expect(validateQuoteStatus(status)).toBe(true)
      })
      
      invalidStatuses.forEach(status => {
        expect(validateQuoteStatus(status)).toBe(false)
      })
    })

    test('validation errors should maintain data integrity', () => {
      fc.assert(fc.property(invalidQuoteRequestGenerator, (quoteData) => {
        const validation = validateQuoteRequest(quoteData)
        
        if (!validation.isValid) {
          // Each error should have field and message
          validation.errors.forEach(error => {
            expect(error.field).toBeTruthy()
            expect(typeof error.field).toBe('string')
            expect(error.message).toBeTruthy()
            expect(typeof error.message).toBe('string')
          })
          
          // Error formatting should be consistent
          const formatted = formatValidationErrors(validation.errors)
          expect(formatted).toContain(':')
          expect(formatted.split(',').length).toBe(validation.errors.length)
        }
      }), { numRuns: 100 })
    })
  })
})