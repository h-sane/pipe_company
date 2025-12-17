import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PrismaClient, UserRole, Permission } from '@prisma/client'
import { 
  validateProductData, 
  sanitizeProductData, 
  createAuditLogEntry, 
  formatValidationErrors 
} from '@/lib/product-validation'
import { 
  createSecureApiHandler, 
  createApiResponse, 
  createErrorResponse,
  sanitizeQueryParams,
  logSecurityEvent
} from '@/lib/secure-api'
import { sanitizePagination, sanitizeSearchQuery } from '@/lib/input-sanitization'

// Define enum values directly from schema
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

// Secure GET handler for products
async function handleGet(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  
  // Sanitize query parameters
  const sanitizedParams = sanitizeQueryParams(searchParams)
  
  // Sanitize pagination
  const pagination = sanitizePagination(
    sanitizedParams.page,
    sanitizedParams.limit
  )
  
  // Sanitize search query
  const search = sanitizedParams.search ? 
    sanitizeSearchQuery(sanitizedParams.search) : null
  
  // Build secure where clause
  const where: any = {}
  
  if (sanitizedParams.category && Object.values(ProductCategory).includes(sanitizedParams.category as any)) {
    where.category = sanitizedParams.category
  }
  
  if (sanitizedParams.brand) {
    where.brand = {
      contains: sanitizedParams.brand.substring(0, 50), // Limit length
      mode: 'insensitive'
    }
  }
  
  if (sanitizedParams.material) {
    where.material = {
      contains: sanitizedParams.material.substring(0, 50),
      mode: 'insensitive'
    }
  }
  
  if (sanitizedParams.availability && Object.values(AvailabilityStatus).includes(sanitizedParams.availability as any)) {
    where.availability = sanitizedParams.availability
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { material: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  // Price filtering with validation
  if (sanitizedParams.minPrice || sanitizedParams.maxPrice) {
    where.basePrice = {}
    
    const minPrice = parseFloat(sanitizedParams.minPrice || '0')
    const maxPrice = parseFloat(sanitizedParams.maxPrice || '999999')
    
    if (!isNaN(minPrice) && minPrice >= 0) {
      where.basePrice.gte = minPrice
    }
    
    if (!isNaN(maxPrice) && maxPrice > 0 && maxPrice <= 999999) {
      where.basePrice.lte = maxPrice
    }
  }
  
  // Execute queries with error handling
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: true,
        documents: true,
        bulkDiscounts: true
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset,
      take: pagination.limit
    }),
    prisma.product.count({ where })
  ])
  
  return createApiResponse({
    products,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit)
    }
  })
}

// Secure POST handler for product creation
async function handlePost(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    logSecurityEvent('unauthorized_product_creation_attempt', {
      ip: req.ip || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    }, 'medium')
    
    return createErrorResponse('Authentication required', 401)
  }
  
  const body = await req.json()
  
  // Sanitize input data
  const sanitizedData = sanitizeProductData(body)
  
  // Validate product data
  const validation = validateProductData(sanitizedData, false)
  if (!validation.isValid) {
    return createErrorResponse(
      'Validation failed',
      400,
      { 
        details: formatValidationErrors(validation.errors),
        validationErrors: validation.errors
      }
    )
  }
  
  // Get client information for audit logging
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  // Create product with secure transaction
  const product = await prisma.$transaction(async (tx: PrismaClient) => {
    const newProduct = await tx.product.create({
      data: {
        name: sanitizedData.name!,
        description: sanitizedData.description!,
        category: sanitizedData.category!,
        brand: sanitizedData.brand!,
        diameter: sanitizedData.diameter!,
        length: sanitizedData.length!,
        material: sanitizedData.material!,
        pressureRating: sanitizedData.pressureRating!,
        temperature: sanitizedData.temperature!,
        standards: sanitizedData.standards || [],
        applications: sanitizedData.applications || [],
        basePrice: sanitizedData.basePrice!,
        currency: sanitizedData.currency || 'USD',
        pricePerUnit: sanitizedData.pricePerUnit!,
        availability: sanitizedData.availability || AvailabilityStatus.IN_STOCK
      },
      include: {
        images: true,
        documents: true,
        bulkDiscounts: true
      }
    })
    
    // Create bulk discounts if provided
    if (sanitizedData.bulkDiscounts && Array.isArray(sanitizedData.bulkDiscounts)) {
      await tx.bulkDiscount.createMany({
        data: sanitizedData.bulkDiscounts.map((discount: any) => ({
          productId: newProduct.id,
          minQuantity: discount.minQuantity,
          discount: discount.discount
        }))
      })
    }
    
    // Create audit log entry
    const auditEntry = createAuditLogEntry(
      newProduct.id,
      'CREATE',
      session.user.id,
      null,
      newProduct,
      { ipAddress: clientIP, userAgent }
    )
    
    // Log security event for product creation
    logSecurityEvent('product_created', {
      productId: newProduct.id,
      userId: session.user.id,
      userRole: session.user.role,
      ipAddress: clientIP
    }, 'low')
    
    return newProduct
  })
  
  return createApiResponse(product, 'Product created successfully', 201)
}

// Export secure API handlers
export const GET = createSecureApiHandler(
  {
    allowedMethods: ['GET'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 200 // Higher limit for public endpoint
    }
  },
  { GET: handleGet }
)

export const POST = createSecureApiHandler(
  {
    requireAuth: true,
    requiredRoles: [UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    requiredPermissions: [Permission.MANAGE_PRODUCTS],
    allowedMethods: ['POST'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50 // Lower limit for admin operations
    }
  },
  { POST: handlePost }
)