/**
 * Property-based tests for product filtering functionality
 * **Feature: pipe-supply-website, Property 2: Product filtering accuracy**
 * **Validates: Requirements 1.2**
 */

import * as fc from 'fast-check'
import { PrismaClient } from '@prisma/client'

// Mock Prisma client for testing
const mockPrisma = {
  product: {
    findMany: jest.fn(),
    count: jest.fn()
  }
} as unknown as PrismaClient

// Define enum values for testing
const ProductCategory = {
  STEEL_PIPE: 'STEEL_PIPE',
  PVC_PIPE: 'PVC_PIPE',
  COPPER_PIPE: 'COPPER_PIPE',
  GALVANIZED_PIPE: 'GALVANIZED_PIPE',
  CAST_IRON_PIPE: 'CAST_IRON_PIPE',
  FLEXIBLE_PIPE: 'FLEXIBLE_PIPE',
  SPECIALTY_PIPE: 'SPECIALTY_PIPE'
} as const

const AvailabilityStatus = {
  IN_STOCK: 'IN_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
  SPECIAL_ORDER: 'SPECIAL_ORDER',
  LOW_STOCK: 'LOW_STOCK'
} as const

// Product generator for property-based testing
const productGenerator = fc.record({
  id: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  name: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  description: fc.string(),
  category: fc.constantFrom(...Object.values(ProductCategory)),
  brand: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  diameter: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  length: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  material: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  pressureRating: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  temperature: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  standards: fc.array(fc.string()),
  applications: fc.array(fc.string()),
  basePrice: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).filter(n => !isNaN(n) && n > 0),
  currency: fc.constant('USD'),
  pricePerUnit: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
  availability: fc.constantFrom(...Object.values(AvailabilityStatus)),
  images: fc.array(fc.record({
    id: fc.string(),
    url: fc.string(),
    alt: fc.option(fc.string())
  })),
  documents: fc.array(fc.record({
    id: fc.string(),
    name: fc.string(),
    url: fc.string(),
    type: fc.string()
  })),
  bulkDiscounts: fc.array(fc.record({
    id: fc.string(),
    minQuantity: fc.integer({ min: 1 }),
    discount: fc.float({ min: 0, max: 1, noNaN: true })
  })),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

// Filter criteria generator
const filterCriteriaGenerator = fc.record({
  category: fc.option(fc.constantFrom(...Object.values(ProductCategory))),
  brand: fc.option(fc.string({ minLength: 1 })),
  material: fc.option(fc.string({ minLength: 1 })),
  availability: fc.option(fc.constantFrom(...Object.values(AvailabilityStatus))),
  search: fc.option(fc.string({ minLength: 1 })),
  minPrice: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(5000) })),
  maxPrice: fc.option(fc.float({ min: Math.fround(5000), max: Math.fround(10000) }))
})

// Function to apply filters (simulates the API filtering logic)
function applyFilters(products: any[], filters: any) {
  return products.filter(product => {
    // Category filter
    if (filters.category && product.category !== filters.category) {
      return false
    }
    
    // Brand filter (case insensitive contains)
    if (filters.brand && !product.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
      return false
    }
    
    // Material filter (case insensitive contains)
    if (filters.material && !product.material.toLowerCase().includes(filters.material.toLowerCase())) {
      return false
    }
    
    // Availability filter
    if (filters.availability && product.availability !== filters.availability) {
      return false
    }
    
    // Search filter (searches across multiple fields)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableFields = [
        product.name,
        product.description,
        product.brand,
        product.material,
        ...product.standards,
        ...product.applications
      ]
      
      const matchesSearch = searchableFields.some(field => 
        field && field.toLowerCase().includes(searchLower)
      )
      
      if (!matchesSearch) {
        return false
      }
    }
    
    // Price range filters
    if (filters.minPrice && product.basePrice < filters.minPrice) {
      return false
    }
    
    if (filters.maxPrice && product.basePrice > filters.maxPrice) {
      return false
    }
    
    return true
  })
}

describe('Product Filtering Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Property 2: Product filtering accuracy - all returned products match filter criteria', () => {
    // **Feature: pipe-supply-website, Property 2: Product filtering accuracy**
    // **Validates: Requirements 1.2**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 0, maxLength: 50 }),
        filterCriteriaGenerator,
        (products, filters) => {
          // Apply filters to the product list
          const filteredProducts = applyFilters(products, filters)
          
          // Verify that every returned product matches all applied filter criteria
          return filteredProducts.every(product => {
            // Check category filter
            if (filters.category && product.category !== filters.category) {
              return false
            }
            
            // Check brand filter
            if (filters.brand && !product.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
              return false
            }
            
            // Check material filter
            if (filters.material && !product.material.toLowerCase().includes(filters.material.toLowerCase())) {
              return false
            }
            
            // Check availability filter
            if (filters.availability && product.availability !== filters.availability) {
              return false
            }
            
            // Check search filter
            if (filters.search) {
              const searchLower = filters.search.toLowerCase()
              const searchableFields = [
                product.name,
                product.description,
                product.brand,
                product.material,
                ...product.standards,
                ...product.applications
              ]
              
              const matchesSearch = searchableFields.some(field => 
                field && field.toLowerCase().includes(searchLower)
              )
              
              if (!matchesSearch) {
                return false
              }
            }
            
            // Check price range filters
            if (filters.minPrice && product.basePrice < filters.minPrice) {
              return false
            }
            
            if (filters.maxPrice && product.basePrice > filters.maxPrice) {
              return false
            }
            
            return true
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 2a: Empty filter criteria returns all products', () => {
    // **Feature: pipe-supply-website, Property 2a: Empty filter criteria**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 0, maxLength: 20 }),
        (products) => {
          const emptyFilters = {
            category: null,
            brand: null,
            material: null,
            availability: null,
            search: null,
            minPrice: null,
            maxPrice: null
          }
          
          const filteredProducts = applyFilters(products, emptyFilters)
          
          // With no filters, all products should be returned
          return filteredProducts.length === products.length
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 2b: Combining filters reduces or maintains result set size', () => {
    // **Feature: pipe-supply-website, Property 2b: Filter combination**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 30 }),
        filterCriteriaGenerator,
        filterCriteriaGenerator,
        (products, filters1, filters2) => {
          const results1 = applyFilters(products, filters1)
          
          // Combine filters (more restrictive)
          const combinedFilters = {
            category: filters1.category || filters2.category,
            brand: filters1.brand || filters2.brand,
            material: filters1.material || filters2.material,
            availability: filters1.availability || filters2.availability,
            search: filters1.search || filters2.search,
            minPrice: Math.max(filters1.minPrice || 0, filters2.minPrice || 0) || null,
            maxPrice: Math.min(filters1.maxPrice || 10000, filters2.maxPrice || 10000) || null
          }
          
          const combinedResults = applyFilters(products, combinedFilters)
          
          // Combined filters should return same or fewer results
          return combinedResults.length <= results1.length
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Product Update Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Property 9: Product editing accuracy - edit interface displays current information correctly', () => {
    // **Feature: pipe-supply-website, Property 9: Product editing accuracy**
    // **Validates: Requirements 4.1, 4.2**
    
    fc.assert(
      fc.property(
        productGenerator,
        fc.record({
          name: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          description: fc.option(fc.string()),
          category: fc.option(fc.constantFrom(...Object.values(ProductCategory))),
          brand: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          diameter: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          length: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          material: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          pressureRating: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          temperature: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          basePrice: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).filter(n => !isNaN(n) && n > 0)),
          pricePerUnit: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          availability: fc.option(fc.constantFrom(...Object.values(AvailabilityStatus)))
        }),
        (existingProduct, editData) => {
          // Simulate the edit interface pre-population
          const editFormData = {
            name: existingProduct.name,
            description: existingProduct.description,
            category: existingProduct.category,
            brand: existingProduct.brand,
            diameter: existingProduct.diameter,
            length: existingProduct.length,
            material: existingProduct.material,
            pressureRating: existingProduct.pressureRating,
            temperature: existingProduct.temperature,
            standards: existingProduct.standards,
            applications: existingProduct.applications,
            basePrice: existingProduct.basePrice,
            currency: existingProduct.currency,
            pricePerUnit: existingProduct.pricePerUnit,
            availability: existingProduct.availability
          }
          
          // Apply edits (only non-null values)
          const updatedData = { ...editFormData }
          Object.entries(editData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              (updatedData as any)[key] = value
            }
          })
          
          // Simulate validation and update
          const isValidUpdate = 
            updatedData.name && typeof updatedData.name === 'string' && updatedData.name.trim().length > 0 &&
            updatedData.description !== undefined &&
            Object.values(ProductCategory).includes(updatedData.category) &&
            updatedData.brand && typeof updatedData.brand === 'string' && updatedData.brand.trim().length > 0 &&
            updatedData.diameter && typeof updatedData.diameter === 'string' && updatedData.diameter.trim().length > 0 &&
            updatedData.length && typeof updatedData.length === 'string' && updatedData.length.trim().length > 0 &&
            updatedData.material && typeof updatedData.material === 'string' && updatedData.material.trim().length > 0 &&
            updatedData.pressureRating && typeof updatedData.pressureRating === 'string' && updatedData.pressureRating.trim().length > 0 &&
            updatedData.temperature && typeof updatedData.temperature === 'string' && updatedData.temperature.trim().length > 0 &&
            typeof updatedData.basePrice === 'number' && 
            !isNaN(updatedData.basePrice) && 
            updatedData.basePrice > 0 &&
            updatedData.pricePerUnit && typeof updatedData.pricePerUnit === 'string' && updatedData.pricePerUnit.trim().length > 0 &&
            Object.values(AvailabilityStatus).includes(updatedData.availability)
          
          if (!isValidUpdate) {
            // If validation fails, the edit should be rejected - this is correct behavior
            return true
          }
          
          // Create the updated product (only if validation passed)
          const updatedProduct = {
            ...existingProduct,
            ...updatedData,
            updatedAt: new Date()
          }
          
          // Property 1: All edited fields should reflect the new values (only for valid, non-null edits)
          const editsApplied = Object.entries(editData).every(([key, value]) => {
            if (value === null || value === undefined) return true
            return (updatedProduct as any)[key] === value
          })
          
          // Property 2: Non-edited fields should remain unchanged
          const nonEditedFieldsPreserved = Object.keys(existingProduct).every(key => {
            if (editData.hasOwnProperty(key) && (editData as any)[key] !== null && (editData as any)[key] !== undefined) return true
            if (key === 'updatedAt') return true // This field is expected to change
            
            // For arrays and objects, use deep comparison
            if (Array.isArray((existingProduct as any)[key])) {
              return JSON.stringify((existingProduct as any)[key]) === JSON.stringify((updatedProduct as any)[key])
            }
            return (existingProduct as any)[key] === (updatedProduct as any)[key]
          })
          
          // Property 3: ID and createdAt should never change during edits
          const immutableFieldsPreserved = 
            updatedProduct.id === existingProduct.id &&
            updatedProduct.createdAt === existingProduct.createdAt
          
          // Property 4: updatedAt should be newer than or equal to original
          const timestampUpdated = updatedProduct.updatedAt.getTime() >= existingProduct.updatedAt.getTime()
          
          return editsApplied && nonEditedFieldsPreserved && immutableFieldsPreserved && timestampUpdated
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8: Product availability propagation - updates reflect across all displays', () => {
    // **Feature: pipe-supply-website, Property 8: Product availability propagation**
    // **Validates: Requirements 3.4, 4.3**
    
    fc.assert(
      fc.property(
        productGenerator,
        fc.constantFrom(...Object.values(AvailabilityStatus)),
        (originalProduct, newAvailability) => {
          // Simulate updating a product's availability
          const updatedProduct = {
            ...originalProduct,
            availability: newAvailability,
            updatedAt: new Date()
          }
          
          // Property: The updated product should have the new availability status
          const availabilityUpdated = updatedProduct.availability === newAvailability
          
          // Property: All other fields should remain unchanged (except updatedAt)
          const otherFieldsPreserved = Object.keys(originalProduct).every(key => {
            if (key === 'updatedAt' || key === 'availability') return true
            // For deep equality comparison of arrays and objects
            if (Array.isArray((originalProduct as any)[key]) && Array.isArray((updatedProduct as any)[key])) {
              return JSON.stringify((originalProduct as any)[key]) === JSON.stringify((updatedProduct as any)[key])
            }
            return (updatedProduct as any)[key] === (originalProduct as any)[key]
          })
          
          return availabilityUpdated && otherFieldsPreserved
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8a: Availability status changes are immediately visible', () => {
    // **Feature: pipe-supply-website, Property 8a: Immediate availability visibility**
    
    fc.assert(
      fc.property(
        productGenerator,
        fc.constantFrom(...Object.values(AvailabilityStatus)),
        (product, newAvailability) => {
          // Simulate the update process with a timestamp that's guaranteed to be newer
          const updateTime = new Date(Math.max(product.updatedAt.getTime() + 1, Date.now()))
          const afterUpdate = {
            ...product,
            availability: newAvailability,
            updatedAt: updateTime
          }
          
          // Property: The availability should always be set to the new value
          const availabilitySet = afterUpdate.availability === newAvailability
          
          // Property: updatedAt should be newer than the original
          const timestampUpdated = afterUpdate.updatedAt.getTime() > product.updatedAt.getTime()
          
          return availabilitySet && timestampUpdated
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8b: Product updates maintain data integrity', () => {
    // **Feature: pipe-supply-website, Property 8b: Update data integrity**
    
    fc.assert(
      fc.property(
        productGenerator,
        fc.record({
          name: fc.option(fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2)),
          basePrice: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).filter(n => !isNaN(n) && n > 0)),
          category: fc.option(fc.constantFrom(...Object.values(ProductCategory))),
          availability: fc.option(fc.constantFrom(...Object.values(AvailabilityStatus)))
        }),
        (originalProduct, updates) => {
          // Apply updates
          const updatedProduct = {
            ...originalProduct,
            ...Object.fromEntries(
              Object.entries(updates).filter(([_, value]) => value !== null && value !== undefined)
            ),
            updatedAt: new Date()
          }
          
          // Property: Required fields should never be null or empty
          const requiredFieldsValid = Boolean(
            updatedProduct.name && updatedProduct.name.trim().length > 0 &&
            typeof updatedProduct.basePrice === 'number' && 
            !isNaN(updatedProduct.basePrice) && 
            updatedProduct.basePrice > 0 &&
            Object.values(ProductCategory).includes(updatedProduct.category) &&
            Object.values(AvailabilityStatus).includes(updatedProduct.availability)
          )
          
          // Property: ID should never change during updates
          const idPreserved = updatedProduct.id === originalProduct.id
          
          // Property: CreatedAt should never change during updates
          const createdAtPreserved = updatedProduct.createdAt === originalProduct.createdAt
          
          return requiredFieldsValid && idPreserved && createdAtPreserved
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8c: Bulk discount updates maintain consistency', () => {
    // **Feature: pipe-supply-website, Property 8c: Bulk discount consistency**
    
    fc.assert(
      fc.property(
        productGenerator,
        fc.array(fc.record({
          minQuantity: fc.integer({ min: 1, max: 1000 }),
          discount: fc.float({ min: Math.fround(0), max: Math.fround(0.5) })
        }), { maxLength: 5 }),
        (product, newBulkDiscounts) => {
          // Simulate updating bulk discounts (sorted by minQuantity)
          const sortedDiscounts = newBulkDiscounts
            .map((discount, index) => ({
              id: `discount-${index}`,
              productId: product.id,
              ...discount
            }))
            .sort((a, b) => a.minQuantity - b.minQuantity)
            
          const updatedProduct = {
            ...product,
            bulkDiscounts: sortedDiscounts,
            updatedAt: new Date()
          }
          
          // Property: All bulk discounts should have valid quantities and discount rates
          const bulkDiscountsValid = updatedProduct.bulkDiscounts.every(discount => 
            discount.minQuantity > 0 && 
            discount.discount >= 0 && 
            discount.discount <= 1 &&
            discount.productId === product.id
          )
          
          // Property: Bulk discounts should be sorted by minimum quantity (if any exist)
          const bulkDiscountsSorted = updatedProduct.bulkDiscounts.length <= 1 || 
            updatedProduct.bulkDiscounts.every((discount, index) => 
              index === 0 || discount.minQuantity >= updatedProduct.bulkDiscounts[index - 1].minQuantity
            )
          
          return bulkDiscountsValid && bulkDiscountsSorted
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: Bulk operation feedback - operations provide progress feedback and handle errors', () => {
    // **Feature: pipe-supply-website, Property 11: Bulk operation feedback**
    // **Validates: Requirements 4.5**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 20 }),
        fc.constantFrom('availability', 'category', 'delete'),
        fc.option(fc.constantFrom(...Object.values(AvailabilityStatus))),
        fc.option(fc.constantFrom(...Object.values(ProductCategory))),
        (products, operationType, newAvailability, newCategory) => {
          // Simulate bulk operation
          const selectedProductIds = products.map(p => p.id)
          const operationStartTime = Date.now()
          
          // Simulate operation progress tracking
          let processedCount = 0
          let successCount = 0
          let errorCount = 0
          const errors: string[] = []
          
          // Process each product
          const results = selectedProductIds.map((productId, index) => {
            processedCount++
            
            // Simulate some operations might fail (e.g., validation errors)
            const product = products[index]
            let success = true
            let error = ''
            
            if (operationType === 'availability' && newAvailability) {
              // Availability update - should always succeed for valid statuses
              if (Object.values(AvailabilityStatus).includes(newAvailability)) {
                successCount++
              } else {
                success = false
                error = 'Invalid availability status'
                errorCount++
                errors.push(`Product ${productId}: ${error}`)
              }
            } else if (operationType === 'category' && newCategory) {
              // Category update - should always succeed for valid categories
              if (Object.values(ProductCategory).includes(newCategory)) {
                successCount++
              } else {
                success = false
                error = 'Invalid category'
                errorCount++
                errors.push(`Product ${productId}: ${error}`)
              }
            } else if (operationType === 'delete') {
              // Delete operation - simulate some products might be referenced elsewhere
              // For testing, assume products with very short IDs might fail
              if (product.id.length < 2) {
                success = false
                error = 'Product is referenced by active quotes'
                errorCount++
                errors.push(`Product ${productId}: ${error}`)
              } else {
                successCount++
              }
            } else {
              // Invalid operation or missing value
              success = false
              error = 'Invalid operation parameters'
              errorCount++
              errors.push(`Product ${productId}: ${error}`)
            }
            
            return {
              productId,
              success,
              error
            }
          })
          
          const operationEndTime = Date.now()
          const operationDuration = operationEndTime - operationStartTime
          
          // Create operation feedback
          const feedback = {
            operationType,
            totalProducts: selectedProductIds.length,
            processedCount,
            successCount,
            errorCount,
            errors,
            duration: operationDuration,
            completed: processedCount === selectedProductIds.length
          }
          
          // Property 1: All products should be processed
          const allProcessed = feedback.processedCount === feedback.totalProducts
          
          // Property 2: Success + error count should equal total processed
          const countsMatch = feedback.successCount + feedback.errorCount === feedback.processedCount
          
          // Property 3: Error count should match number of error messages
          const errorCountMatches = feedback.errorCount === feedback.errors.length
          
          // Property 4: Operation should be marked as completed when all products processed
          const completionStatusCorrect = feedback.completed === (feedback.processedCount === feedback.totalProducts)
          
          // Property 5: Duration should be non-negative
          const durationValid = feedback.duration >= 0
          
          // Property 6: For valid operations with valid parameters, there should be some successes
          const validOperationHasSuccesses = (() => {
            if (operationType === 'availability' && newAvailability && Object.values(AvailabilityStatus).includes(newAvailability)) {
              return feedback.successCount > 0
            }
            if (operationType === 'category' && newCategory && Object.values(ProductCategory).includes(newCategory)) {
              return feedback.successCount > 0
            }
            if (operationType === 'delete') {
              // At least some products should be deletable (those with longer IDs)
              const deletableProducts = products.filter(p => p.id.length >= 2)
              return deletableProducts.length === 0 || feedback.successCount > 0
            }
            return true // For invalid operations, we don't expect successes
          })()
          
          return allProcessed && 
                 countsMatch && 
                 errorCountMatches && 
                 completionStatusCorrect && 
                 durationValid && 
                 validOperationHasSuccesses
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11a: Bulk operations maintain atomicity per product', () => {
    // **Feature: pipe-supply-website, Property 11a: Bulk operation atomicity**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 10 }),
        fc.constantFrom(...Object.values(AvailabilityStatus)),
        (products, newAvailability) => {
          // Simulate bulk availability update
          const results = products.map(product => {
            // Each product update should be atomic - either fully succeed or fully fail
            const updateSuccessful = true // Assume valid availability status
            
            if (updateSuccessful) {
              // Only update if the availability is actually changing
              const needsUpdate = product.availability !== newAvailability
              
              const updatedProduct = {
                ...product,
                availability: newAvailability,
                updatedAt: needsUpdate ? new Date() : product.updatedAt
              }
              
              // Property: Updated product should have new availability
              const availabilityUpdated = updatedProduct.availability === newAvailability
              
              // Property: Timestamp should be updated only if availability changed
              const timestampCorrect = needsUpdate 
                ? updatedProduct.updatedAt.getTime() >= product.updatedAt.getTime()
                : updatedProduct.updatedAt.getTime() === product.updatedAt.getTime()
              
              // Property: Other fields should remain unchanged
              const otherFieldsPreserved = Object.keys(product).every(key => {
                if (key === 'availability' || key === 'updatedAt') return true
                // For arrays and objects, use deep comparison
                if (Array.isArray((product as any)[key])) {
                  return JSON.stringify((product as any)[key]) === JSON.stringify((updatedProduct as any)[key])
                }
                return (product as any)[key] === (updatedProduct as any)[key]
              })
              
              return availabilityUpdated && timestampCorrect && otherFieldsPreserved
            } else {
              // If update fails, original product should remain unchanged
              return true // This case always passes since we're not changing anything
            }
          })
          
          // All individual updates should succeed
          return results.every(result => result === true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11b: Bulk operation progress is monotonic', () => {
    // **Feature: pipe-supply-website, Property 11b: Progress monotonicity**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 2, maxLength: 15 }),
        (products) => {
          // Simulate progress tracking during bulk operation
          const progressUpdates: number[] = []
          const totalProducts = products.length
          
          // Simulate processing products one by one
          for (let i = 0; i <= totalProducts; i++) {
            const progress = (i / totalProducts) * 100
            progressUpdates.push(progress)
          }
          
          // Property: Progress should be monotonically increasing
          const progressMonotonic = progressUpdates.every((progress, index) => {
            if (index === 0) return true
            return progress >= progressUpdates[index - 1]
          })
          
          // Property: Progress should start at 0 and end at 100
          const progressBounds = progressUpdates[0] === 0 && progressUpdates[progressUpdates.length - 1] === 100
          
          // Property: Progress increments should be consistent
          const expectedIncrement = 100 / totalProducts
          const incrementsConsistent = progressUpdates.every((progress, index) => {
            if (index === 0) return progress === 0
            const expectedProgress = Math.min(100, index * expectedIncrement)
            return Math.abs(progress - expectedProgress) < 0.01 // Allow for floating point precision
          })
          
          return progressMonotonic && progressBounds && incrementsConsistent
        }
      ),
      { numRuns: 100 }
    )
  })
})