import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { 
  validateQuoteStatus, 
  createQuoteAuditEntry 
} from '@/lib/quote-validation'

// Define enum values directly from schema
const QuoteStatus = {
  PENDING: 'PENDING',
  RESPONDED: 'RESPONDED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
} as const

// GET /api/quotes/[id] - Get specific quote (admin only)
export async function GET(
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
    
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: params.id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                basePrice: true,
                currency: true,
                diameter: true,
                length: true,
                material: true,
                availability: true
              }
            }
          }
        }
      }
    })
    
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }
    
    return NextResponse.json(quote)
  } catch (error) {
    console.error('Quote fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}

// PUT /api/quotes/[id] - Update quote status and response (admin only)
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
    const { status, response } = body
    
    // Validate status if provided
    if (status && !validateQuoteStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid quote status' },
        { status: 400 }
      )
    }
    
    // Validate response if provided
    if (response && typeof response !== 'string') {
      return NextResponse.json(
        { error: 'Response must be a string' },
        { status: 400 }
      )
    }
    
    // Get current quote for audit trail
    const currentQuote = await prisma.quoteRequest.findUnique({
      where: { id: params.id },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    })
    
    if (!currentQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }
    
    // Get client IP and user agent for audit logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    // Update quote with transaction
    const updatedQuote = await prisma.$transaction(async (tx) => {
      const updateData: any = {}
      
      if (status) {
        updateData.status = status
        
        // Set respondedAt timestamp when status changes to RESPONDED
        if (status === QuoteStatus.RESPONDED && currentQuote.status !== QuoteStatus.RESPONDED) {
          updateData.respondedAt = new Date()
        }
      }
      
      if (response !== undefined) {
        updateData.response = response
      }
      
      const updated = await tx.quoteRequest.update({
        where: { id: params.id },
        data: updateData,
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  basePrice: true,
                  currency: true,
                  diameter: true,
                  length: true,
                  material: true,
                  availability: true
                }
              }
            }
          }
        }
      })
      
      // Create audit log entry
      const auditEntry = createQuoteAuditEntry(
        updated.id,
        'UPDATE',
        session.user.id,
        currentQuote,
        updated,
        { ipAddress: clientIP, userAgent }
      )
      
      // Log the audit entry (in a real app, you'd store this in a database)
      console.log('Quote updated:', auditEntry)
      
      return updated
    })
    
    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error('Quote update error:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

// DELETE /api/quotes/[id] - Delete quote (admin only)
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
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Get current quote for audit trail
    const currentQuote = await prisma.quoteRequest.findUnique({
      where: { id: params.id },
      include: {
        products: true
      }
    })
    
    if (!currentQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }
    
    // Get client IP and user agent for audit logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    // Delete quote with transaction
    await prisma.$transaction(async (tx: PrismaClient) => {
      // Delete quote products first (cascade should handle this, but being explicit)
      await tx.quoteProduct.deleteMany({
        where: { quoteId: params.id }
      })
      
      // Delete the quote
      await tx.quoteRequest.delete({
        where: { id: params.id }
      })
      
      // Create audit log entry
      const auditEntry = createQuoteAuditEntry(
        params.id,
        'DELETE',
        session.user.id,
        currentQuote,
        null,
        { ipAddress: clientIP, userAgent }
      )
      
      // Log the audit entry (in a real app, you'd store this in a database)
      console.log('Quote deleted:', auditEntry)
    })
    
    return NextResponse.json({ message: 'Quote deleted successfully' })
  } catch (error) {
    console.error('Quote deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}