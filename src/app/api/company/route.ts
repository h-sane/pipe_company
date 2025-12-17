import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const companyContentSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  history: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    validUntil: z.string().optional(),
    documentUrl: z.string().optional()
  })).optional(),
  serviceAreas: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional()
})

// GET /api/company - Get company information
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get company content from database
    const companyContent = await prisma.companyContent.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!companyContent) {
      // Return default company content structure
      return NextResponse.json({
        name: '',
        description: '',
        history: '',
        mission: '',
        vision: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        certifications: [],
        serviceAreas: [],
        specialties: []
      })
    }

    return NextResponse.json(companyContent)
  } catch (error) {
    console.error('Error fetching company content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/company - Update company information
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = companyContentSchema.parse(body)

    // Update or create company content
    const companyContent = await prisma.companyContent.upsert({
      where: { id: body.id || 'default' },
      update: {
        ...validatedData,
        updatedAt: new Date()
      },
      create: {
        id: 'default',
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(companyContent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Error updating company content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}