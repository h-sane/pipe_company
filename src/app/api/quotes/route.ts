import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { 
  validateQuoteRequest, 
  sanitizeQuoteRequest, 
  createQuoteAuditEntry, 
  formatValidationErrors 
} from '@/lib/quote-validation'
import { 
  sendQuoteNotificationToAdmin, 
  sendQuoteConfirmationToCustomer 
} from '@/lib/email-utils'

// Define enum values directly from schema
const QuoteStatus = {
  PENDING: 'PENDING',
  RESPONDED: 'RESPONDED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
} as const

// POST /api/quotes - Submit quote request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Sanitize input data
    const sanitizedData = sanitizeQuoteRequest(body)
    
    // Validate quote request data
    const validation = validateQuoteRequest(sanitizedData)
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
    
    // Get client IP for audit logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    // Check for duplicate submissions (same email and products within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const existingQuote = await prisma.quoteRequest.findFirst({
      where: {
        customerEmail: sanitizedData.customerEmail,
        submittedAt: {
          gte: fiveMinutesAgo
        }
      },
      include: {
        products: true
      }
    })
    
    if (existingQuote) {
      // Check if products are similar (same product IDs)
      const existingProductIds = existingQuote.products.map((p: any) => p.productId).sort()
      const newProductIds = sanitizedData.products.map((p: any) => p.productId).sort()
      
      if (JSON.stringify(existingProductIds) === JSON.stringify(newProductIds)) {
        return NextResponse.json(
          { error: 'Duplicate submission detected. Please wait before submitting another quote request.' },
          { status: 409 }
        )
      }
    }
    
    // Verify that all products exist
    const productIds = sanitizedData.products.map((p: any) => p.productId)
    const existingProducts = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })
    
    if (existingProducts.length !== productIds.length) {
      const foundIds = existingProducts.map((p: any) => p.id)
      const missingIds = productIds.filter(id => !foundIds.includes(id))
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Create quote request with transaction
    const quoteRequest = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.quoteRequest.create({
        data: {
          customerName: sanitizedData.customerName,
          customerEmail: sanitizedData.customerEmail,
          customerPhone: sanitizedData.customerPhone,
          company: sanitizedData.company,
          address: sanitizedData.address,
          city: sanitizedData.city,
          state: sanitizedData.state,
          zipCode: sanitizedData.zipCode,
          country: sanitizedData.country,
          message: sanitizedData.message,
          status: QuoteStatus.PENDING,
          products: {
            create: sanitizedData.products.map(product => ({
              productId: product.productId,
              quantity: product.quantity,
              notes: product.notes
            }))
          }
        },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  basePrice: true,
                  currency: true
                }
              }
            }
          }
        }
      })
      
      // Create audit log entry
      const auditEntry = createQuoteAuditEntry(
        newQuote.id,
        'CREATE',
        'anonymous', // No user session for public quote requests
        null,
        newQuote,
        { ipAddress: clientIP, userAgent }
      )
      
      // Log the audit entry (in a real app, you'd store this in a database)
      console.log('Quote request created:', auditEntry)
      
      return newQuote
    })
    
    // Send email notifications
    const notificationData = {
      quoteId: quoteRequest.id,
      customerName: quoteRequest.customerName,
      customerEmail: quoteRequest.customerEmail,
      company: quoteRequest.company || undefined,
      products: quoteRequest.products.map((qp: any) => ({
        productName: qp.product.name,
        quantity: qp.quantity,
        notes: qp.notes || undefined
      })),
      message: quoteRequest.message || undefined
    }
    
    // Send notifications (don't fail the request if emails fail)
    try {
      await Promise.all([
        sendQuoteNotificationToAdmin(notificationData),
        sendQuoteConfirmationToCustomer(notificationData)
      ])
    } catch (emailError) {
      console.error('Email notification failed:', emailError)
      // Continue with successful response even if emails fail
    }
    
    // Return quote without sensitive internal data
    const responseData = {
      id: quoteRequest.id,
      customerName: quoteRequest.customerName,
      customerEmail: quoteRequest.customerEmail,
      company: quoteRequest.company,
      status: quoteRequest.status,
      submittedAt: quoteRequest.submittedAt,
      products: quoteRequest.products.map((qp: any) => ({
        product: {
          id: qp.product.id,
          name: qp.product.name,
          brand: qp.product.brand
        },
        quantity: qp.quantity,
        notes: qp.notes
      }))
    }
    
    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Quote request creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create quote request' },
      { status: 500 }
    )
  }
}

// GET /api/quotes - List quotes (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const { searchParams } = new URL(req.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Filter parameters
    const status = searchParams.get('status') as keyof typeof QuoteStatus | null
    const customerEmail = searchParams.get('customerEmail')
    const company = searchParams.get('company')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (customerEmail) {
      where.customerEmail = {
        contains: customerEmail,
        mode: 'insensitive'
      }
    }
    
    if (company) {
      where.company = {
        contains: company,
        mode: 'insensitive'
      }
    }
    
    if (dateFrom || dateTo) {
      where.submittedAt = {}
      if (dateFrom) where.submittedAt.gte = new Date(dateFrom)
      if (dateTo) where.submittedAt.lte = new Date(dateTo)
    }
    
    // Execute queries
    const [quotes, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  basePrice: true,
                  currency: true
                }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.quoteRequest.count({ where })
    ])
    
    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Quotes fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}