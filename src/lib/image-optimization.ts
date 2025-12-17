/**
 * Image optimization utilities for lazy loading and responsive images
 */

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(baseUrl: string, sizes: number[]): string {
  return sizes
    .map(size => `${baseUrl}?w=${size} ${size}w`)
    .join(', ')
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints: { maxWidth: string; size: string }[]): string {
  return breakpoints
    .map(bp => `(max-width: ${bp.maxWidth}) ${bp.size}`)
    .join(', ')
}

/**
 * Default responsive breakpoints for product images
 */
export const productImageBreakpoints = [
  { maxWidth: '640px', size: '100vw' },
  { maxWidth: '768px', size: '50vw' },
  { maxWidth: '1024px', size: '33vw' },
  { maxWidth: '1280px', size: '25vw' },
]

/**
 * Default responsive breakpoints for detail images
 */
export const detailImageBreakpoints = [
  { maxWidth: '640px', size: '100vw' },
  { maxWidth: '1024px', size: '50vw' },
]

/**
 * Blur data URL for image placeholders
 */
export const blurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=='

/**
 * Image loading priority helper
 */
export function getImagePriority(index: number, isAboveFold: boolean = false): boolean {
  // Prioritize first image and above-the-fold images
  return index === 0 || isAboveFold
}

/**
 * Image loading strategy
 */
export function getImageLoading(index: number, isAboveFold: boolean = false): 'eager' | 'lazy' {
  // Load first few images eagerly, rest lazily
  return index < 2 || isAboveFold ? 'eager' : 'lazy'
}

/**
 * Optimize image URL with query parameters
 */
export function optimizeImageUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  } = {}
): string {
  const params = new URLSearchParams()
  
  if (options.width) params.append('w', options.width.toString())
  if (options.height) params.append('h', options.height.toString())
  if (options.quality) params.append('q', options.quality.toString())
  if (options.format) params.append('f', options.format)
  
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

/**
 * Check if image should use lazy loading
 */
export function shouldLazyLoad(index: number, totalImages: number): boolean {
  // Don't lazy load first image or if there's only one image
  if (totalImages === 1 || index === 0) {
    return false
  }
  return true
}

/**
 * Get optimal image dimensions based on viewport
 */
export function getOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight
  
  let width = originalWidth
  let height = originalHeight
  
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }
  
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}
