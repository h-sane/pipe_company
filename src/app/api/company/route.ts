import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// GET /api/company - Get company information (public)
export async function GET() {
  try {
    // For MVP, return hardcoded company info
    const companyInfo = {
      name: "Professional Pipe Supply Co.",
      description: "Leading supplier of industrial pipes and fittings",
      address: {
        street: "123 Industrial Blvd",
        city: "Manufacturing City",
        state: "TX",
        zipCode: "12345",
        country: "USA"
      },
      phone: "(555) 123-4567",
      email: "info@pipesupply.com",
      website: "https://pipesupply.com",
      certifications: [
        {
          name: "ISO 9001:2015",
          issuer: "International Organization for Standardization",
          validUntil: "2025-12-31"
        }
      ],
      serviceAreas: ["Texas", "Oklahoma", "Louisiana"],
      specialties: ["Industrial Pipes", "Custom Fittings", "Emergency Supply"]
    }
    
    return NextResponse.json(companyInfo)
  } catch (error) {
    console.error('Error fetching company info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company information' },
      { status: 500 }
    )
  }
}

// PUT /api/company - Update company information (admin only)
export async function PUT(request: NextRequest) {
  try {
    requireAuth(request) // Will throw if not authenticated
    
    const data = await request.json()
    
    // For MVP, just return success
    return NextResponse.json({ 
      message: 'Company information updated successfully',
      data 
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Error updating company info:', error)
    return NextResponse.json(
      { error: 'Failed to update company information' },
      { status: 500 }
    )
  }
}