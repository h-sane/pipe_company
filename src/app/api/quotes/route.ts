import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/quotes - List quotes (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = getSession(req)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    
    const skip = (page - 1) * limit
    const where: any = {}
    if (status) where.status = status
    
    const [quotes, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          products: {
            include: {
              product: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
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
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

// POST /api/quotes - Create quote (public)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    const quote = await prisma.quoteRequest.create({
      data: {
        ...data,
        status: 'PENDING'
      }
    })
    
    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}