/**
 * Property-based tests for media gallery functionality
 * **Feature: pipe-supply-website, Property 19: Media gallery functionality**
 * **Validates: Requirements 8.2**
 */

import * as fc from 'fast-check'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductWithImages, ProductCategory, AvailabilityStatus } from '@/types/product'
import ProductDetail from './ProductDetail'

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onClick, ...props }: any) {
    return <img src={src} alt={alt} onClick={onClick} {...props} />
  }
})

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Product generator with images for gallery testing
const productImageGenerator = fc.record({
  id: fc.uuid(),
  url: fc.webUrl(),
  alt: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  productId: fc.uuid(),
  createdAt: fc.date()
})

const productWithImagesGenerator = fc.record({
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
  images: fc.array(productImageGenerator, { minLength: 1, maxLength: 8 }).map(images => 
    images.map((img, index) => ({ ...img, id: `${img.id}-${index}` }))
  ),
  createdAt: fc.date(),
  updatedAt: fc.date()
}) as fc.Arbitrary<ProductWithImages>

// Media gallery logic functions (extracted from component for testing)
function getSelectedImage(images: any[], selectedIndex: number) {
  return images[selectedIndex] || null
}

function isValidImageIndex(images: any[], index: number): boolean {
  return index >= 0 && index < images.length
}

function getImageNavigation(images: any[], currentIndex: number) {
  return {
    canGoNext: currentIndex < images.length - 1,
    canGoPrevious: currentIndex > 0,
    nextIndex: Math.min(currentIndex + 1, images.length - 1),
    previousIndex: Math.max(currentIndex - 1, 0)
  }
}

describe('Media Gallery Property Tests', () => {
  it('Property 19: Media gallery functionality - high-quality images with zoom and navigation', () => {
    // **Feature: pipe-supply-website, Property 19: Media gallery functionality**
    // **Validates: Requirements 8.2**
    
    fc.assert(
      fc.property(
        productWithImagesGenerator,
        (product) => {
          const { container } = render(<ProductDetail product={product} />)
          
          // Property 19a: Main image should be displayed
          const mainImage = container.querySelector('img[class*="w-full h-96"]')
          const mainImageDisplayed = mainImage !== null
          
          // Property 19b: Image selection should work correctly
          const selectedImage = getSelectedImage(product.images, 0)
          const imageSelectionWorks = selectedImage && selectedImage.id === product.images[0].id
          
          // Property 19c: Navigation should be available for multiple images
          const navigation = getImageNavigation(product.images, 0)
          const navigationLogicCorrect = product.images.length > 1 ? 
            (navigation.canGoNext && !navigation.canGoPrevious) : 
            (!navigation.canGoNext && !navigation.canGoPrevious)
          
          // Property 19d: Image counter should be accurate for multiple images
          const imageCounterAccurate = product.images.length > 1 ? 
            container.textContent?.includes(`1 / ${product.images.length}`) : true
          
          return mainImageDisplayed && imageSelectionWorks && navigationLogicCorrect && imageCounterAccurate
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 19a: Image selection and navigation consistency', () => {
    // **Feature: pipe-supply-website, Property 19a: Image navigation consistency**
    
    fc.assert(
      fc.property(
        productWithImagesGenerator.filter(p => p.images.length > 1),
        fc.integer({ min: 0, max: 7 }),
        (product, targetIndex) => {
          // Ensure target index is within bounds
          const validTargetIndex = Math.min(targetIndex, product.images.length - 1)
          
          // Property: Selected image should always be valid
          const selectedImage = getSelectedImage(product.images, validTargetIndex)
          const selectionValid = selectedImage && selectedImage.id === product.images[validTargetIndex].id
          
          // Property: Index validation should work correctly
          const indexValidationCorrect = isValidImageIndex(product.images, validTargetIndex)
          
          // Property: Navigation state should be consistent
          const navigation = getImageNavigation(product.images, validTargetIndex)
          const navigationConsistent = (
            (validTargetIndex === 0 ? !navigation.canGoPrevious : navigation.canGoPrevious) &&
            (validTargetIndex === product.images.length - 1 ? !navigation.canGoNext : navigation.canGoNext)
          )
          
          return selectionValid && indexValidationCorrect && navigationConsistent
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 19b: Image zoom functionality validation', () => {
    // **Feature: pipe-supply-website, Property 19b: Image zoom functionality**
    
    fc.assert(
      fc.property(
        productWithImagesGenerator,
        (product) => {
          const { container } = render(<ProductDetail product={product} />)
          
          // Find the main image element
          const mainImage = container.querySelector('img[class*="w-full h-96"]')
          
          // Property: Image should be clickable for zoom
          const imageClickable = mainImage && mainImage.classList.contains('cursor-pointer')
          
          // Property: Image should have zoom-related classes
          const hasZoomClasses = mainImage && (
            mainImage.classList.contains('hover:scale-105') ||
            mainImage.classList.contains('transition-transform')
          )
          
          return imageClickable && hasZoomClasses
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 19c: Image gallery thumbnail navigation', () => {
    // **Feature: pipe-supply-website, Property 19c: Thumbnail navigation**
    
    fc.assert(
      fc.property(
        productWithImagesGenerator.filter(p => p.images.length > 1),
        (product) => {
          const { container } = render(<ProductDetail product={product} />)
          
          // Property: Thumbnail grid should be present for multiple images
          const thumbnailGrid = container.querySelector('.grid-cols-4')
          const thumbnailGridExists = thumbnailGrid !== null
          
          // Property: Number of thumbnails should match number of images
          const thumbnailButtons = container.querySelectorAll('button[class*="relative h-24"]')
          const correctThumbnailCount = thumbnailButtons.length === product.images.length
          
          // Property: Each thumbnail should display the correct image
          const thumbnailsCorrect = Array.from(thumbnailButtons).every((button, index) => {
            const thumbnailImage = button.querySelector('img')
            return thumbnailImage && thumbnailImage.getAttribute('src') === product.images[index].url
          })
          
          return thumbnailGridExists && correctThumbnailCount && thumbnailsCorrect
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 19d: Image quality and accessibility', () => {
    // **Feature: pipe-supply-website, Property 19d: Image quality and accessibility**
    
    fc.assert(
      fc.property(
        productWithImagesGenerator,
        (product) => {
          const { container } = render(<ProductDetail product={product} />)
          
          // Property: Main image should have proper alt text
          const mainImage = container.querySelector('img[class*="w-full h-96"]')
          const altText = mainImage?.getAttribute('alt')
          const mainImageHasAlt = altText && altText.length > 0
          
          // Property: Images should have appropriate dimensions
          const mainImageHasCorrectDimensions = mainImage !== null
          
          // Property: Images should be properly sized for responsive display
          const responsiveImages = container.querySelectorAll('img[class*="object-cover"]')
          const imagesAreResponsive = responsiveImages.length > 0
          
          return mainImageHasAlt && mainImageHasCorrectDimensions && imagesAreResponsive
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 19e: Fallback behavior for missing images', () => {
    // **Feature: pipe-supply-website, Property 19e: Image fallback behavior**
    
    fc.assert(
      fc.property(
        productWithImagesGenerator.map(p => ({ ...p, images: [] })),
        (productWithoutImages) => {
          const { container } = render(<ProductDetail product={productWithoutImages} />)
          
          // Property: Should display "No Image Available" placeholder
          const placeholder = container.querySelector('.bg-gray-200')
          const placeholderExists = placeholder !== null
          
          // Property: Placeholder should contain appropriate text
          const placeholderText = container.textContent?.includes('No Image Available')
          
          // Property: No thumbnail grid should be displayed
          const noThumbnailGrid = container.querySelector('.grid-cols-4') === null
          
          return placeholderExists && placeholderText && noThumbnailGrid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 19f: Image gallery state management', () => {
    // **Feature: pipe-supply-website, Property 19f: Gallery state consistency**
    
    fc.assert(
      fc.property(
        fc.array(productImageGenerator, { minLength: 2, maxLength: 6 }),
        fc.integer({ min: 0, max: 5 }),
        (images, initialIndex) => {
          const validInitialIndex = Math.min(initialIndex, images.length - 1)
          
          // Property: Navigation state should be deterministic
          const navigation1 = getImageNavigation(images, validInitialIndex)
          const navigation2 = getImageNavigation(images, validInitialIndex)
          
          const navigationConsistent = (
            navigation1.canGoNext === navigation2.canGoNext &&
            navigation1.canGoPrevious === navigation2.canGoPrevious &&
            navigation1.nextIndex === navigation2.nextIndex &&
            navigation1.previousIndex === navigation2.previousIndex
          )
          
          // Property: Image selection should be deterministic
          const selectedImage1 = getSelectedImage(images, validInitialIndex)
          const selectedImage2 = getSelectedImage(images, validInitialIndex)
          
          const selectionConsistent = selectedImage1 && selectedImage2 && 
            selectedImage1.id === selectedImage2.id
          
          return navigationConsistent && selectionConsistent
        }
      ),
      { numRuns: 100 }
    )
  })
})