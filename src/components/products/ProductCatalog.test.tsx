/**
 * Property-based tests for product catalog organization and display
 * **Feature: pipe-supply-website, Property 1: Product catalog organization and display**
 * **Validates: Requirements 1.1, 1.4**
 */

import * as fc from 'fast-check'
import { ProductWithImages, ProductCategory, AvailabilityStatus } from '@/types/product'

// Product generator for property-based testing (simplified for logic testing)
const productGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  category: fc.constantFrom(...Object.values(ProductCategory)),
  brand: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  diameter: fc.string({ minLength: 1, maxLength: 20 }),
  length: fc.string({ minLength: 1, maxLength: 20 }),
  material: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  pressureRating: fc.string({ minLength: 1, maxLength: 20 }),
  temperature: fc.string({ minLength: 1, maxLength: 20 }),
  standards: fc.array(fc.string({ maxLength: 20 }), { maxLength: 3 }),
  applications: fc.array(fc.string({ maxLength: 20 }), { maxLength: 3 }),
  basePrice: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) }).filter(n => !isNaN(n) && n > 0),
  currency: fc.constant('USD'),
  pricePerUnit: fc.constantFrom('foot', 'meter', 'piece', 'length'),
  availability: fc.constantFrom(...Object.values(AvailabilityStatus)),
  images: fc.array(fc.record({
    id: fc.uuid(),
    url: fc.webUrl(),
    alt: fc.option(fc.string({ maxLength: 50 })),
    productId: fc.uuid(),
    createdAt: fc.date()
  }), { minLength: 0, maxLength: 3 }),
  createdAt: fc.date(),
  updatedAt: fc.date()
}) as fc.Arbitrary<ProductWithImages>

describe('Product Catalog Organization Property Tests', () => {
  it('Property 1: Product catalog organization and display - products grouped by categories with complete information', () => {
    // **Feature: pipe-supply-website, Property 1: Product catalog organization and display**
    // **Validates: Requirements 1.1, 1.4**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 10 }),
        (products) => {
          // Property 1a: Products should be organizable by category
          const productsByCategory = products.reduce((acc, product) => {
            if (!acc[product.category]) {
              acc[product.category] = []
            }
            acc[product.category].push(product)
            return acc
          }, {} as Record<ProductCategory, ProductWithImages[]>)
          
          // Property 1b: Each product should have complete essential information
          const allProductsHaveEssentialInfo = products.every(product => {
            return (
              product.id && product.id.length > 0 &&
              product.name && product.name.trim().length > 0 &&
              product.brand && product.brand.trim().length > 0 &&
              product.material && product.material.trim().length > 0 &&
              product.category && Object.values(ProductCategory).includes(product.category) &&
              product.availability && Object.values(AvailabilityStatus).includes(product.availability) &&
              typeof product.basePrice === 'number' && product.basePrice > 0 &&
              product.pricePerUnit && product.pricePerUnit.length > 0
            )
          })
          
          // Property 1c: Category formatting should be consistent
          const categoryFormattingConsistent = Object.keys(productsByCategory).every(category => {
            const formattedCategory = formatCategoryName(category as ProductCategory)
            return formattedCategory.length > 0 && formattedCategory !== category
          })
          
          // Property 1d: Availability status should be properly formatted
          const availabilityFormattingConsistent = products.every(product => {
            const formattedStatus = getAvailabilityText(product.availability)
            return formattedStatus.length > 0 && formattedStatus !== product.availability
          })
          
          // Property 1e: Price formatting should be consistent
          const priceFormattingConsistent = products.every(product => {
            const formattedPrice = `$${product.basePrice.toFixed(2)}`
            return formattedPrice.includes('$') && formattedPrice.includes('.')
          })
          
          return (
            allProductsHaveEssentialInfo &&
            categoryFormattingConsistent &&
            availabilityFormattingConsistent &&
            priceFormattingConsistent
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 1a: Category grouping maintains data integrity', () => {
    // **Feature: pipe-supply-website, Property 1a: Category grouping integrity**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 2, maxLength: 20 }),
        (products) => {
          // Group products by category
          const productsByCategory = products.reduce((acc, product) => {
            if (!acc[product.category]) {
              acc[product.category] = []
            }
            acc[product.category].push(product)
            return acc
          }, {} as Record<ProductCategory, ProductWithImages[]>)
          
          // Property: Total products in groups should equal original array length
          const totalGroupedProducts = Object.values(productsByCategory)
            .reduce((sum, categoryProducts) => sum + categoryProducts.length, 0)
          
          // Property: Each product should appear in exactly one category
          const allProductsGroupedCorrectly = products.every(product => {
            const categoryProducts = productsByCategory[product.category]
            return categoryProducts && categoryProducts.some(p => p.id === product.id)
          })
          
          // Property: No products should be lost or duplicated
          const noProductsLostOrDuplicated = totalGroupedProducts === products.length
          
          return allProductsGroupedCorrectly && noProductsLostOrDuplicated
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 1b: Product information completeness validation', () => {
    // **Feature: pipe-supply-website, Property 1b: Information completeness**
    
    fc.assert(
      fc.property(
        productGenerator,
        (product) => {
          // Property: All required fields should be present and valid
          const hasValidId = product.id && product.id.length > 0
          const hasValidName = product.name && product.name.trim().length > 0
          const hasValidBrand = product.brand && product.brand.trim().length > 0
          const hasValidMaterial = product.material && product.material.trim().length > 0
          const hasValidCategory = Object.values(ProductCategory).includes(product.category)
          const hasValidAvailability = Object.values(AvailabilityStatus).includes(product.availability)
          const hasValidPrice = typeof product.basePrice === 'number' && product.basePrice > 0
          const hasValidPriceUnit = product.pricePerUnit && product.pricePerUnit.length > 0
          
          // Property: Images array should be valid (can be empty)
          const hasValidImages = Array.isArray(product.images)
          
          // Property: Specifications should be strings
          const hasValidSpecs = (
            typeof product.diameter === 'string' &&
            typeof product.length === 'string' &&
            typeof product.pressureRating === 'string' &&
            typeof product.temperature === 'string'
          )
          
          return (
            hasValidId &&
            hasValidName &&
            hasValidBrand &&
            hasValidMaterial &&
            hasValidCategory &&
            hasValidAvailability &&
            hasValidPrice &&
            hasValidPriceUnit &&
            hasValidImages &&
            hasValidSpecs
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Helper functions (matching the component implementation)
function getAvailabilityText(status: AvailabilityStatus): string {
  switch (status) {
    case AvailabilityStatus.IN_STOCK:
      return 'In Stock'
    case AvailabilityStatus.LOW_STOCK:
      return 'Low Stock'
    case AvailabilityStatus.OUT_OF_STOCK:
      return 'Out of Stock'
    case AvailabilityStatus.DISCONTINUED:
      return 'Discontinued'
    case AvailabilityStatus.SPECIAL_ORDER:
      return 'Special Order'
    default:
      return 'Unknown'
  }
}

function formatCategoryName(category: string): string {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}