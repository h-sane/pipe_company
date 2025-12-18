import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './auth-helper'
import { UserRole, Permission } from '@prisma/client'
import { validateApiInput, ValidationResult } from './input-sanitization'

// Simple auth check for MVP
export function requireAdminAuth(req: NextRequest) {
  const session = getSession(req)
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
  return session
}

export function createSecureHandler<T = any>(
  handler: (req: NextRequest, data: T) => Promise<NextResponse>,
  validationSchema?: any
) {
  return async (req: NextRequest) => {
    try {
      requireAdminAuth(req)
      
      let data: T | undefined
      if (req.method !== 'GET' && validationSchema) {
        const body = await req.json()
        const validation = validateApiInput(body, validationSchema)
        if (!validation.isValid) {
          return NextResponse.json(
            { error: 'Validation failed', details: validation.errors },
            { status: 400 }
          )
        }
        data = validation.sanitizedData
      }
      
      return await handler(req, data!)
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}