/**
 * Database query optimization utilities
 * Provides helpers for efficient data fetching and pagination
 */

import { Prisma } from '@prisma/client'

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Calculate skip and take for pagination
 */
export function getPaginationParams(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit
  const take = limit
  
  return { skip, take }
}

/**
 * Standard product query with optimized includes
 */
export const optimizedProductInclude = {
  images: {
    take: 5, // Limit images to reduce payload
    orderBy: { createdAt: 'asc' as const },
  },
  documents: {
    take: 10,
    orderBy: { createdAt: 'desc' as const },
  },
  bulkDiscounts: {
    orderBy: { minQuantity: 'asc' as const },
  },
} satisfies Prisma.ProductInclude

/**
 * Minimal product query for list views
 */
export const minimalProductInclude = {
  images: {
    take: 1, // Only first image for cards
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.ProductInclude

/**
 * Optimized quote query with includes
 */
export const optimizedQuoteInclude = {
  products: {
    include: {
      product: {
        include: {
          images: {
            take: 1,
            orderBy: { createdAt: 'asc' as const },
          },
        },
      },
    },
  },
} satisfies Prisma.QuoteRequestInclude

/**
 * Build product filter conditions
 */
export function buildProductFilters(filters: {
  category?: string
  brand?: string
  material?: string
  availability?: string
  search?: string
  minPrice?: number
  maxPrice?: number
}): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {}

  if (filters.category) {
    where.category = filters.category as any
  }

  if (filters.brand) {
    where.brand = filters.brand
  }

  if (filters.material) {
    where.material = filters.material
  }

  if (filters.availability) {
    where.availability = filters.availability as any
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { brand: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.basePrice = {}
    if (filters.minPrice !== undefined) {
      where.basePrice.gte = filters.minPrice
    }
    if (filters.maxPrice !== undefined) {
      where.basePrice.lte = filters.maxPrice
    }
  }

  return where
}

/**
 * Standard product ordering
 */
export const productOrderBy = {
  default: { createdAt: 'desc' as const },
  nameAsc: { name: 'asc' as const },
  nameDesc: { name: 'desc' as const },
  priceAsc: { basePrice: 'asc' as const },
  priceDesc: { basePrice: 'desc' as const },
  newest: { createdAt: 'desc' as const },
  oldest: { createdAt: 'asc' as const },
}

/**
 * Get order by clause from string
 */
export function getProductOrderBy(orderBy?: string): Prisma.ProductOrderByWithRelationInput {
  switch (orderBy) {
    case 'name-asc':
      return productOrderBy.nameAsc
    case 'name-desc':
      return productOrderBy.nameDesc
    case 'price-asc':
      return productOrderBy.priceAsc
    case 'price-desc':
      return productOrderBy.priceDesc
    case 'newest':
      return productOrderBy.newest
    case 'oldest':
      return productOrderBy.oldest
    default:
      return productOrderBy.default
  }
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(totalCount: number, limit: number): number {
  return Math.ceil(totalCount / limit)
}

/**
 * Build pagination response
 */
export function buildPaginationResponse<T>(
  data: T[],
  totalCount: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: calculateTotalPages(totalCount, limit),
      hasNextPage: page < calculateTotalPages(totalCount, limit),
      hasPreviousPage: page > 1,
    },
  }
}

/**
 * Batch query helper to prevent N+1 queries
 */
export async function batchQuery<T, K extends keyof T>(
  items: T[],
  key: K,
  fetchFn: (ids: T[K][]) => Promise<Map<T[K], any>>
): Promise<T[]> {
  const ids = items.map(item => item[key])
  const dataMap = await fetchFn(ids)
  
  return items.map(item => ({
    ...item,
    [key]: dataMap.get(item[key]),
  }))
}
