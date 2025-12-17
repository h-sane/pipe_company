/**
 * Metrics endpoint for monitoring and observability
 * Provides application performance metrics
 */

import { NextResponse } from 'next/server'
import { metricsCollector, errorTracker } from '@/lib/monitoring'
import { cache } from '@/lib/cache-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metrics
 * Returns application metrics
 */
export async function GET() {
  const metrics = {
    timestamp: new Date().toISOString(),
    requests: metricsCollector.getSummary(),
    errors: errorTracker.getStats(),
    cache: cache.getStats(),
    process: {
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    },
  }

  return NextResponse.json(metrics)
}
