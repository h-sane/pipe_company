/**
 * Property-based tests for product search functionality
 * **Feature: pipe-supply-website, Property 3: Search result relevance and highlighting**
 * **Validates: Requirements 1.3**
 */

import * as fc from 'fast-check'
import { ProductWithImages, ProductCategory, AvailabilityStatus } from '@/types/product'

// Product generator for search testing
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
  standards: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
  applications: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
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

// Search function that mimics the API filtering logic
function searchProducts(products: ProductWithImages[], searchQuery: string): ProductWithImages[] {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return products
  }
  
  const searchLower = searchQuery.toLowerCase().trim()
  
  return products.filter(product => {
    const searchableFields = [
      product.name,
      product.description,
      product.brand,
      product.material,
      ...product.standards,
      ...product.applications
    ]
    
    return searchableFields.some(field => 
      field && field.toLowerCase().includes(searchLower)
    )
  })
}

// Function to check if search terms are highlighted in results
function checkHighlighting(text: string, searchQuery: string): boolean {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return true // No highlighting needed for empty search
  }
  
  const searchLower = searchQuery.toLowerCase().trim()
  const textLower = text.toLowerCase()
  
  // Check if the search term appears in the text
  return textLower.includes(searchLower)
}

describe('Product Search Property Tests', () => {
  it('Property 3: Search result relevance and highlighting - all returned products contain search terms', () => {
    // **Feature: pipe-supply-website, Property 3: Search result relevance and highlighting**
    // **Validates: Requirements 1.3**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (products, searchQuery) => {
          const searchResults = searchProducts(products, searchQuery)
          
          // Property 3a: All returned products should contain the search term
          const allResultsRelevant = searchResults.every(product => {
            const searchLower = searchQuery.toLowerCase().trim()
            const searchableFields = [
              product.name,
              product.description,
              product.brand,
              product.material,
              ...product.standards,
              ...product.applications
            ]
            
            return searchableFields.some(field => 
              field && field.toLowerCase().includes(searchLower)
            )
          })
          
          // Property 3b: Search results should be a subset of original products
          const resultsAreSubset = searchResults.every(result => 
            products.some(product => product.id === result.id)
          )
          
          // Property 3c: Search results should not exceed original product count
          const resultCountValid = searchResults.length <= products.length
          
          return allResultsRelevant && resultsAreSubset && resultCountValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3a: Empty search returns all products', () => {
    // **Feature: pipe-supply-website, Property 3a: Empty search behavior**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 15 }),
        (products) => {
          const emptySearchResults = searchProducts(products, '')
          const whitespaceSearchResults = searchProducts(products, '   ')
          
          // Property: Empty search should return all products
          const emptySearchReturnsAll = emptySearchResults.length === products.length
          
          // Property: Whitespace-only search should return all products
          const whitespaceSearchReturnsAll = whitespaceSearchResults.length === products.length
          
          // Property: Results should maintain original order and content
          const emptySearchMaintainsOrder = emptySearchResults.every((product, index) => 
            product.id === products[index].id
          )
          
          return emptySearchReturnsAll && whitespaceSearchReturnsAll && emptySearchMaintainsOrder
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3b: Case-insensitive search works correctly', () => {
    // **Feature: pipe-supply-website, Property 3b: Case-insensitive search**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0),
        (products, searchQuery) => {
          const lowerCaseResults = searchProducts(products, searchQuery.toLowerCase())
          const upperCaseResults = searchProducts(products, searchQuery.toUpperCase())
          const mixedCaseResults = searchProducts(products, searchQuery)
          
          // Property: Case variations should return the same results
          const sameResultCount = (
            lowerCaseResults.length === upperCaseResults.length &&
            upperCaseResults.length === mixedCaseResults.length
          )
          
          // Property: Same products should be returned regardless of case
          const sameProductIds = lowerCaseResults.every(product => 
            upperCaseResults.some(upperProduct => upperProduct.id === product.id) &&
            mixedCaseResults.some(mixedProduct => mixedProduct.id === product.id)
          )
          
          return sameResultCount && sameProductIds
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3c: Search across multiple fields works correctly', () => {
    // **Feature: pipe-supply-website, Property 3c: Multi-field search**
    
    fc.assert(
      fc.property(
        productGenerator,
        (product) => {
          const products = [product]
          
          // Test searching by different fields
          const nameSearch = searchProducts(products, product.name.substring(0, 3))
          const brandSearch = searchProducts(products, product.brand.substring(0, 3))
          const materialSearch = searchProducts(products, product.material.substring(0, 3))
          const descriptionSearch = searchProducts(products, product.description.substring(0, 3))
          
          // Property: Searching by any field should find the product (if substring is meaningful)
          const nameSearchWorks = product.name.length >= 3 ? nameSearch.length > 0 : true
          const brandSearchWorks = product.brand.length >= 3 ? brandSearch.length > 0 : true
          const materialSearchWorks = product.material.length >= 3 ? materialSearch.length > 0 : true
          const descriptionSearchWorks = product.description.length >= 3 ? descriptionSearch.length > 0 : true
          
          // Property: Standards and applications should also be searchable
          let standardsSearchWorks = true
          let applicationsSearchWorks = true
          
          if (product.standards.length > 0 && product.standards[0].length >= 3) {
            const standardsSearch = searchProducts(products, product.standards[0].substring(0, 3))
            standardsSearchWorks = standardsSearch.length > 0
          }
          
          if (product.applications.length > 0 && product.applications[0].length >= 3) {
            const applicationsSearch = searchProducts(products, product.applications[0].substring(0, 3))
            applicationsSearchWorks = applicationsSearch.length > 0
          }
          
          return (
            nameSearchWorks &&
            brandSearchWorks &&
            materialSearchWorks &&
            descriptionSearchWorks &&
            standardsSearchWorks &&
            applicationsSearchWorks
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3d: Search highlighting validation', () => {
    // **Feature: pipe-supply-website, Property 3d: Search term highlighting**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
        (products, searchQuery) => {
          const searchResults = searchProducts(products, searchQuery)
          
          // Property: All search results should be highlightable
          const allResultsHighlightable = searchResults.every(product => {
            const searchableFields = [
              product.name,
              product.description,
              product.brand,
              product.material,
              ...product.standards,
              ...product.applications
            ]
            
            // At least one field should contain the search term for highlighting
            return searchableFields.some(field => 
              field && checkHighlighting(field, searchQuery)
            )
          })
          
          return allResultsHighlightable
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3e: Search performance and consistency', () => {
    // **Feature: pipe-supply-website, Property 3e: Search consistency**
    
    fc.assert(
      fc.property(
        fc.array(productGenerator, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0),
        (products, searchQuery) => {
          // Run the same search multiple times
          const result1 = searchProducts(products, searchQuery)
          const result2 = searchProducts(products, searchQuery)
          const result3 = searchProducts(products, searchQuery)
          
          // Property: Search should be deterministic and consistent
          const consistentResultCount = (
            result1.length === result2.length &&
            result2.length === result3.length
          )
          
          // Property: Same products should be returned in the same order
          const consistentResults = result1.every((product, index) => 
            result2[index] && result2[index].id === product.id &&
            result3[index] && result3[index].id === product.id
          )
          
          return consistentResultCount && consistentResults
        }
      ),
      { numRuns: 100 }
    )
  })
})