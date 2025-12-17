// Product-related types based on Prisma schema

export enum ProductCategory {
  STEEL_PIPE = 'STEEL_PIPE',
  PVC_PIPE = 'PVC_PIPE',
  COPPER_PIPE = 'COPPER_PIPE',
  GALVANIZED_PIPE = 'GALVANIZED_PIPE',
  CAST_IRON_PIPE = 'CAST_IRON_PIPE',
  FLEXIBLE_PIPE = 'FLEXIBLE_PIPE',
  SPECIALTY_PIPE = 'SPECIALTY_PIPE'
}

export enum AvailabilityStatus {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
  SPECIAL_ORDER = 'SPECIAL_ORDER',
  LOW_STOCK = 'LOW_STOCK'
}

export interface ProductImage {
  id: string
  url: string
  alt?: string
  productId: string
  createdAt: Date
}

export interface ProductDocument {
  id: string
  name: string
  url: string
  type: string
  productId: string
  createdAt: Date
}

export interface BulkDiscount {
  id: string
  productId: string
  minQuantity: number
  discount: number
}

export interface Product {
  id: string
  name: string
  description: string
  category: ProductCategory
  brand: string
  diameter: string
  length: string
  material: string
  pressureRating: string
  temperature: string
  standards: string[]
  applications: string[]
  basePrice: number
  currency: string
  pricePerUnit: string
  availability: AvailabilityStatus
  images?: ProductImage[]
  documents?: ProductDocument[]
  bulkDiscounts?: BulkDiscount[]
  createdAt: Date
  updatedAt: Date
}

export interface ProductWithImages extends Product {
  images: ProductImage[]
}

export interface ProductCatalogResponse {
  products: ProductWithImages[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FilterState {
  category: ProductCategory | ''
  brand: string
  material: string
  availability: AvailabilityStatus | ''
  minPrice: string
  maxPrice: string
}

export interface FilterOptions {
  brands: string[]
  materials: string[]
}