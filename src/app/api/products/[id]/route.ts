import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { 
  validateProductData, 
  sanitizeProductData, 
  createAuditLogEntry, 
  formatValidationErrors 
} from '@/lib/product-validation'

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

// GET /api/products/[id] - Get single product
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        documents: true,
        bulkDiscounts: true
      }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const body = await req.json()
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        documents: true,
        bulkDiscounts: true
      }
    })
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    // Sanitize input data
    const sanitizedData = sanitizeProductData(body)
    
    // Validate product data for update
    const validation = validateProductData(sanitizedData, true)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: formatValidationErrors(validation.errors),
          validationErrors: validation.errors
        },
        { status: 400 }
      )
    }
    
    // Get client IP and user agent for audit logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    // Update product with transaction for audit trail
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Prepare update data with only non-null/undefined values
      const updateData: any = {}
      
      if (sanitizedData.name !== undefined) updateData.name = sanitizedData.name
      if (sanitizedData.description !== undefined) updateData.description = sanitizedData.description
      if (sanitizedData.category !== undefined) updateData.category = sanitizedData.category
      if (sanitizedData.brand !== undefined) updateData.brand = sanitizedData.brand
      if (sanitizedData.diameter !== undefined) updateData.diameter = sanitizedData.diameter
      if (sanitizedData.length !== undefined) updateData.length = sanitizedData.length
      if (sanitizedData.material !== undefined) updateData.material = sanitizedData.material
      if (sanitizedData.pressureRating !== undefined) updateData.pressureRating = sanitizedData.pressureRating
      if (sanitizedData.temperature !== undefined) updateData.temperature = sanitizedData.temperature
      if (sanitizedData.standards !== undefined) updateData.standards = sanitizedData.standards
      if (sanitizedData.applications !== undefined) updateData.applications = sanitizedData.applications
      if (sanitizedData.basePrice !== undefined) updateData.basePrice = sanitizedData.basePrice
      if (sanitizedData.currency !== undefined) updateData.currency = sanitizedData.currency
      if (sanitizedData.pricePerUnit !== undefined) updateData.pricePerUnit = sanitizedData.pricePerUnit
      if (sanitizedData.availability !== undefined) updateData.availability = sanitizedData.availability
      
      updateData.updatedAt = new Date()
      
      // Update the product
      const product = await tx.product.update({
        where: { id: params.id },
        data: updateData,
        include: {
          images: true,
          documents: true,
          bulkDiscounts: true
        }
      })
      
      // Update bulk discounts if provided
      if (sanitizedData.bulkDiscounts && Array.isArray(sanitizedData.bulkDiscounts)) {
        // Delete existing bulk discounts
        await tx.bulkDiscount.deleteMany({
          where: { productId: params.id }
        })
        
        // Create new bulk discounts (sorted by minQuantity)
        if (sanitizedData.bulkDiscounts.length > 0) {
          const sortedDiscounts = sanitizedData.bulkDiscounts.sort((a, b) => a.minQuantity - b.minQuantity)
          await tx.bulkDiscount.createMany({
            data: sortedDiscounts.map((discount: any) => ({
              productId: params.id,
              minQuantity: discount.minQuantity,
              discount: discount.discount
            }))
          })
        }
      }
      
      // Create audit log entry
      const auditEntry = createAuditLogEntry(
        params.id,
        'UPDATE',
        session.user.id,
        existingProduct,
        product,
        { ipAddress: clientIP, userAgent }
      )
      
      // Log the audit entry (in a real app, you'd store this in a database)
      console.log('Product updated:', auditEntry)
      
      return product
    })
    
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        quoteProducts: true
      }
    })
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    // Check if product is referenced in quotes
    if (existingProduct.quoteProducts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that is referenced in quotes' },
        { status: 409 }
      )
    }
    
    // Get client IP and user agent for audit logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    // Delete product (cascade will handle related records)
    await prisma.product.delete({
      where: { id: params.id }
    })
    
    // Create audit log entry
    const auditEntry = createAuditLogEntry(
      params.id,
      'DELETE',
      session.user.id,
      existingProduct,
      null,
      { ipAddress: clientIP, userAgent }
    )
    
    // Log the audit entry (in a real app, you'd store this in a database)
    console.log('Product deleted:', auditEntry)
    
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}