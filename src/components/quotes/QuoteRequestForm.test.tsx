/**
 * **Feature: pipe-supply-website, Property 4: Quote form completeness and pre-population**
 * **Validates: Requirements 2.1, 2.4**
 */

import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import QuoteRequestForm from './QuoteRequestForm'
import { Product, ProductCategory, AvailabilityStatus } from '@/types/product'

// Mock fetch for API calls
global.fetch = jest.fn()

describe('QuoteRequestForm Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'quote-123' })
    })
  })

  describe('Property 4: Quote form completeness and pre-population', () => {
    test('form should contain all required customer information fields', () => {
      render(<QuoteRequestForm />)
      
      // Verify all required customer information fields are present
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
      
      // Verify address fields are present
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument()
      
      // Verify message field is present
      expect(screen.getByLabelText(/additional message/i)).toBeInTheDocument()
      
      // Verify submit button is present
      expect(screen.getByRole('button', { name: /submit quote request/i })).toBeInTheDocument()
    })

    test('form should pre-populate with selected product details when provided', () => {
      const testProduct: Product = {
        id: 'test-product-2',
        name: 'Test PVC Pipe',
        description: 'A test PVC pipe',
        category: ProductCategory.PVC_PIPE,
        brand: 'TestBrand',
        diameter: '1 inch',
        length: '8 ft',
        material: 'PVC',
        pressureRating: '100 PSI',
        temperature: '150°F',
        standards: ['ASTM'],
        applications: ['Residential'],
        basePrice: 50,
        currency: 'USD',
        pricePerUnit: 'per foot',
        availability: AvailabilityStatus.IN_STOCK,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      render(<QuoteRequestForm preSelectedProduct={testProduct} />)
      
      // Check for pre-populated product
      const productIdInputs = screen.getAllByDisplayValue(testProduct.id)
      expect(productIdInputs.length).toBeGreaterThan(0)
      
      const productNameInputs = screen.getAllByDisplayValue(testProduct.name)
      expect(productNameInputs.length).toBeGreaterThan(0)
      
      // Verify quantity is set to default value of 1
      const quantityInput = screen.getByDisplayValue('1')
      expect(quantityInput).toBeInTheDocument()
      
      // Verify pre-populated fields are read-only
      const productIdInput = productIdInputs[0] as HTMLInputElement
      const productNameInput = productNameInputs[0] as HTMLInputElement
      expect(productIdInput.readOnly).toBe(true)
      expect(productNameInput.readOnly).toBe(true)
    })

    test('property test: form completeness across different scenarios', () => {
      fc.assert(fc.property(fc.boolean(), (hasProduct) => {
        const testProduct = hasProduct ? {
          id: 'test-id',
          name: 'Test Product',
          description: 'Test description',
          category: ProductCategory.STEEL_PIPE,
          brand: 'TestBrand',
          diameter: '2 inch',
          length: '10 ft',
          material: 'Steel',
          pressureRating: '150 PSI',
          temperature: '200°F',
          standards: ['ASTM'],
          applications: ['Industrial'],
          basePrice: 100,
          currency: 'USD',
          pricePerUnit: 'per foot',
          availability: AvailabilityStatus.IN_STOCK,
          createdAt: new Date(),
          updatedAt: new Date()
        } : undefined

        render(<QuoteRequestForm preSelectedProduct={testProduct} />)
        
        // Form should always have required fields regardless of pre-selection
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
        
        // Use getAllByRole to handle multiple submit buttons
        const submitButtons = screen.getAllByRole('button', { name: /submit quote request/i })
        expect(submitButtons.length).toBeGreaterThan(0)
        
        if (hasProduct) {
          // Should have pre-populated product
          const productIdInputs = screen.getAllByDisplayValue('test-id')
          const productNameInputs = screen.getAllByDisplayValue('Test Product')
          expect(productIdInputs.length).toBeGreaterThan(0)
          expect(productNameInputs.length).toBeGreaterThan(0)
        } else {
          // Should show empty products message
          const emptyMessages = screen.getAllByText(/no products selected/i)
          expect(emptyMessages.length).toBeGreaterThan(0)
        }
      }), { numRuns: 10 })
    })


  })
})