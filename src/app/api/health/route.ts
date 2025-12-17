/**
 * Health check endpoint for monitoring and deployment verification
 * Requirements: 7.1, 7.3
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
    environment: {
      nodeEnv: string
      nodeVersion: string
    }
  }
}

/**
 * GET /api/health
 * Returns system health status
 */
export async function GET() {
  const startTime = Date.now()
  
  const healthCheck: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: 'down',
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      },
    },
  }

  // Check database connectivity
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime
    
    healthCheck.checks.database = {
      status: 'up',
      responseTime: dbResponseTime,
    }
  } catch (error) {
    healthCheck.status = 'unhealthy'
    healthCheck.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage()
  const totalMemory = memoryUsage.heapTotal
  const usedMemory = memoryUsage.heapUsed
  const memoryPercentage = (usedMemory / totalMemory) * 100

  healthCheck.checks.memory = {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round(memoryPercentage * 100) / 100,
  }

  // Set degraded status if memory usage is high
  if (memoryPercentage > 90) {
    healthCheck.status = 'degraded'
  }

  // Return appropriate status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                     healthCheck.status === 'degraded' ? 200 : 503

  return NextResponse.json(healthCheck, { status: statusCode })
}

/**
 * HEAD /api/health
 * Lightweight health check for load balancers
 */
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
