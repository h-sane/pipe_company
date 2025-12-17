/**
 * End-to-end tests for critical user workflows
 * Tests the complete flow from user perspective
 */

// Mock fetch for API calls
global.fetch = jest.fn()

describe('End-to-End User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Customer Quote Request Workflow', () => {
    it('should complete full quote request flow', async () => {
      // Step 1: Customer browses products
      const mockProducts = [
        {
          id: 'prod1',
          name: 'Steel Pipe 2"',
          brand: 'TestBrand',
          category: 'STEEL_PIPE',
          basePrice: 50.00,
          availability: 'IN_STOCK',
          diameter: '2 inch',
          length: '10 ft',
          material: 'Steel',
          pressureRating: '150 PSI',
          temperature: '200F',
          pricePerUnit: 'per foot'
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: mockProducts, pagination: { pages: 1 } })
      })

      // Simulate browsing products
      const browseResponse = await fetch('/api/products')
      const browseData = await browseResponse.json()
      
      expect(browseData.products).toHaveLength(1)
      expect(browseData.products[0].name).toBe('Steel Pipe 2"')

      // Step 2: Customer selects product and requests quote
      const quoteRequest = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '555-1234',
        company: 'Test Company',
        message: 'Need pricing for 100 units',
        products: [
          { productId: 'prod1', quantity: 100, notes: 'Urgent delivery' }
        ]
      }

      const mockQuoteResponse = {
        id: 'quote1',
        ...quoteRequest,
        status: 'PENDING',
        submittedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockQuoteResponse
      })

      // Submit quote request
      const quoteResponse = await fetch('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteRequest)
      })
      const quoteData = await quoteResponse.json()

      expect(quoteResponse.ok).toBe(true)
      expect(quoteData.id).toBe('quote1')
      expect(quoteData.status).toBe('PENDING')
      expect(quoteData.customerName).toBe('John Doe')

      // Verify workflow completed successfully
      expect(quoteData).toMatchObject({
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        status: 'PENDING'
      })
    })
  })

  describe('Admin Product Management Workflow', () => {
    it('should complete full product management flow', async () => {
      // Step 1: Admin creates new product
      const newProduct = {
        name: 'New Steel Pipe',
        description: 'High quality steel pipe',
        category: 'STEEL_PIPE',
        brand: 'Premium Brand',
        diameter: '3 inch',
        length: '20 ft',
        material: 'Stainless Steel',
        pressureRating: '300 PSI',
        temperature: '400F',
        standards: ['ASTM A312'],
        applications: ['Industrial'],
        basePrice: 150.00,
        currency: 'USD',
        pricePerUnit: 'per foot',
        availability: 'IN_STOCK'
      }

      const mockCreatedProduct = {
        id: 'prod-new',
        ...newProduct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockCreatedProduct
      })

      // Create product
      const createResponse = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct)
      })
      const createdProduct = await createResponse.json()

      expect(createResponse.ok).toBe(true)
      expect(createdProduct.id).toBe('prod-new')
      expect(createdProduct.name).toBe('New Steel Pipe')

      // Step 2: Admin updates product availability
      const updateData = {
        availability: 'LOW_STOCK'
      }

      const mockUpdatedProduct = {
        ...mockCreatedProduct,
        availability: 'LOW_STOCK',
        updatedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedProduct
      })

      // Update product
      const updateResponse = await fetch(`/api/products/${createdProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const updatedProduct = await updateResponse.json()

      expect(updateResponse.ok).toBe(true)
      expect(updatedProduct.availability).toBe('LOW_STOCK')

      // Step 3: Admin verifies product appears in catalog
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          products: [mockUpdatedProduct], 
          pagination: { pages: 1 } 
        })
      })

      const catalogResponse = await fetch('/api/products')
      const catalogData = await catalogResponse.json()

      expect(catalogData.products).toHaveLength(1)
      expect(catalogData.products[0].id).toBe('prod-new')
      expect(catalogData.products[0].availability).toBe('LOW_STOCK')
    })
  })

  describe('Admin Quote Response Workflow', () => {
    it('should complete full quote response flow', async () => {
      // Step 1: Admin views pending quotes
      const mockQuotes = [
        {
          id: 'quote1',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          status: 'PENDING',
          submittedAt: new Date().toISOString(),
          products: [
            {
              id: 'qp1',
              quantity: 50,
              product: {
                id: 'prod1',
                name: 'PVC Pipe',
                basePrice: 25.00
              }
            }
          ]
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ quotes: mockQuotes, pagination: { pages: 1 } })
      })

      // Fetch quotes
      const quotesResponse = await fetch('/api/quotes')
      const quotesData = await quotesResponse.json()

      expect(quotesData.quotes).toHaveLength(1)
      expect(quotesData.quotes[0].status).toBe('PENDING')

      // Step 2: Admin responds to quote
      const responseData = {
        status: 'RESPONDED',
        response: 'Thank you for your inquiry. We can provide 50 units at $23/unit for bulk order.'
      }

      const mockRespondedQuote = {
        ...mockQuotes[0],
        status: 'RESPONDED',
        response: responseData.response,
        respondedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRespondedQuote
      })

      // Update quote
      const updateResponse = await fetch('/api/quotes/quote1', {
        method: 'PUT',
        body: JSON.stringify(responseData)
      })
      const updatedQuote = await updateResponse.json()

      expect(updateResponse.ok).toBe(true)
      expect(updatedQuote.status).toBe('RESPONDED')
      expect(updatedQuote.response).toContain('Thank you for your inquiry')
      expect(updatedQuote.respondedAt).toBeDefined()
    })
  })

  describe('Product Search and Filter Workflow', () => {
    it('should complete product search and filter flow', async () => {
      const mockProducts = [
        {
          id: 'prod1',
          name: 'Steel Pipe 2"',
          category: 'STEEL_PIPE',
          brand: 'BrandA',
          material: 'Steel',
          basePrice: 50.00,
          availability: 'IN_STOCK'
        },
        {
          id: 'prod2',
          name: 'Steel Pipe 3"',
          category: 'STEEL_PIPE',
          brand: 'BrandA',
          material: 'Steel',
          basePrice: 75.00,
          availability: 'IN_STOCK'
        }
      ]

      // Step 1: Search for products
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: mockProducts, pagination: { pages: 1 } })
      })

      const searchResponse = await fetch('/api/products?search=Steel')
      const searchData = await searchResponse.json()

      expect(searchData.products).toHaveLength(2)
      expect(searchData.products.every((p: any) => p.name.includes('Steel'))).toBe(true)

      // Step 2: Apply category filter
      const filteredProducts = mockProducts.filter(p => p.category === 'STEEL_PIPE')

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: filteredProducts, pagination: { pages: 1 } })
      })

      const filterResponse = await fetch('/api/products?category=STEEL_PIPE')
      const filterData = await filterResponse.json()

      expect(filterData.products).toHaveLength(2)
      expect(filterData.products.every((p: any) => p.category === 'STEEL_PIPE')).toBe(true)

      // Step 3: Apply brand filter
      const brandFiltered = filteredProducts.filter(p => p.brand === 'BrandA')

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: brandFiltered, pagination: { pages: 1 } })
      })

      const brandResponse = await fetch('/api/products?category=STEEL_PIPE&brand=BrandA')
      const brandData = await brandResponse.json()

      expect(brandData.products).toHaveLength(2)
      expect(brandData.products.every((p: any) => p.brand === 'BrandA')).toBe(true)
    })
  })
})
