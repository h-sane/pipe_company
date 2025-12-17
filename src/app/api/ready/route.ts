/**
 * Readiness check endpoint for deployment orchestration
 * Verifies that the application is ready to receive traffic
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ReadinessCheck {
  ready: boolean
  timestamp: string
  checks: {
    database: boolean
    migrations: boolean
  }
  errors?: string[]
}

/**
 * GET /api/ready
 * Returns readiness status for deployment
 */
export async function GET() {
  const errors: string[] = []
  let ready = true

  const readinessCheck: ReadinessCheck = {
    ready: true,
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      migrations: false,
    },
  }

  // Check database connection
  try {
    await prisma.$connect()
    readinessCheck.checks.database = true
  } catch (error) {
    ready = false
    readinessCheck.checks.database = false
    errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Check if migrations are applied (verify critical tables exist)
  try {
    await prisma.product.findFirst()
    await prisma.user.findFirst()
    readinessCheck.checks.migrations = true
  } catch (error) {
    ready = false
    readinessCheck.checks.migrations = false
    errors.push(`Database migrations not applied: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  readinessCheck.ready = ready
  if (errors.length > 0) {
    readinessCheck.errors = errors
  }

  const statusCode = ready ? 200 : 503

  return NextResponse.json(readinessCheck, { status: statusCode })
}
