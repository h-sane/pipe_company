import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/products - List products (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    const where: any = {}
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          images: true,
          documents: true
        }
      }),
      prisma.product.count({ where })
    ])
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create product (admin only)
export async function POST(req: NextRequest) {
  console.log("STEP 1: request entered")
  try {
    const session = getSession(req)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await req.json()
    console.log("DB HOST:", process.env.DATABASE_URL?.split("@")[1])
    console.log("STEP 2: before prisma import")
    const { PrismaClient } = require('@prisma/client')
    const prismaClient = new PrismaClient()
    console.log("STEP 3: prisma client created")
    console.log("STEP 4: before product.create")
    
    try {
      const product = await prismaClient.product.create({
        data: {
          ...data,
          basePrice: Number(data.basePrice)
        },
        include: {
          images: true,
          documents: true
        }
      })
      
      return NextResponse.json(product, { status: 201 })
    } catch (err) {
      console.error("PRODUCT CREATE ERROR:", err)
      return NextResponse.json(
        { error: String(err) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}