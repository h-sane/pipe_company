import { PrismaClient } from '@prisma/client'
import { prisma } from './prisma'

export interface MigrationStatus {
  applied: boolean
  name: string
  appliedAt?: Date
  error?: string
}

export interface DatabaseInfo {
  version: string
  connectionStatus: 'connected' | 'disconnected' | 'error'
  migrationStatus: MigrationStatus[]
  tableCount: number
  recordCounts: Record<string, number>
}

/**
 * Get comprehensive database information
 */
export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  try {
    // Check connection
    await prisma.$connect()
    
    // Get database version
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`
    const version = versionResult[0]?.version || 'Unknown'

    // Get table information
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `

    // Get record counts for each table
    const recordCounts: Record<string, number> = {}
    
    // Count records in main tables
    try {
      recordCounts.users = await prisma.user.count()
      recordCounts.products = await prisma.product.count()
      recordCounts.quote_requests = await prisma.quoteRequest.count()
      recordCounts.media = await prisma.media.count()
      recordCounts.product_images = await prisma.productImage.count()
      recordCounts.product_documents = await prisma.productDocument.count()
    } catch (error) {
      console.warn('Could not get record counts:', error)
    }

    // Get migration status (simplified - in a real app you'd check _prisma_migrations table)
    const migrationStatus: MigrationStatus[] = [
      {
        applied: true,
        name: 'initial_migration',
        appliedAt: new Date(),
      }
    ]

    return {
      version,
      connectionStatus: 'connected',
      migrationStatus,
      tableCount: tables.length,
      recordCounts,
    }
  } catch (error) {
    return {
      version: 'Unknown',
      connectionStatus: 'error',
      migrationStatus: [],
      tableCount: 0,
      recordCounts: {},
    }
  }
}

/**
 * Reset database to clean state (for development/testing)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production')
  }

  console.log('🔄 Resetting database...')

  try {
    // Delete all data in reverse dependency order
    await prisma.quoteProduct.deleteMany()
    await prisma.bulkDiscount.deleteMany()
    await prisma.productDocument.deleteMany()
    await prisma.productImage.deleteMany()
    await prisma.quoteRequest.deleteMany()
    await prisma.product.deleteMany()
    await prisma.media.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Database reset completed')
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    throw error
  }
}

/**
 * Backup database data to JSON (for development)
 */
export async function backupDatabase(): Promise<{
  users: any[]
  products: any[]
  quoteRequests: any[]
  media: any[]
  timestamp: string
}> {
  console.log('💾 Creating database backup...')

  try {
    const [users, products, quoteRequests, media] = await Promise.all([
      prisma.user.findMany(),
      prisma.product.findMany({
        include: {
          images: true,
          documents: true,
          bulkDiscounts: true,
        }
      }),
      prisma.quoteRequest.findMany({
        include: {
          products: {
            include: {
              product: true,
            }
          }
        }
      }),
      prisma.media.findMany(),
    ])

    const backup = {
      users,
      products,
      quoteRequests,
      media,
      timestamp: new Date().toISOString(),
    }

    console.log('✅ Database backup created')
    return backup
  } catch (error) {
    console.error('❌ Database backup failed:', error)
    throw error
  }
}

/**
 * Validate database integrity
 */
export async function validateDatabaseIntegrity(): Promise<{
  valid: boolean
  issues: string[]
}> {
  const issues: string[] = []

  try {
    // Note: Orphaned records are prevented by onDelete: Cascade in schema
    
    // Check for invalid email formats
    const usersWithInvalidEmails = await prisma.user.findMany({
      where: {
        email: {
          not: {
            contains: '@'
          }
        }
      }
    })
    if (usersWithInvalidEmails.length > 0) {
      issues.push(`Found ${usersWithInvalidEmails.length} users with invalid email formats`)
    }

    // Check for products with invalid prices
    const productsWithInvalidPrices = await prisma.product.findMany({
      where: {
        basePrice: {
          lte: 0
        }
      }
    })
    if (productsWithInvalidPrices.length > 0) {
      issues.push(`Found ${productsWithInvalidPrices.length} products with invalid prices`)
    }

    return {
      valid: issues.length === 0,
      issues
    }
  } catch (error) {
    issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      valid: false,
      issues
    }
  }
}

/**
 * Clean up old data (for maintenance)
 */
export async function cleanupOldData(daysOld: number = 90): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  console.log(`🧹 Cleaning up data older than ${daysOld} days (before ${cutoffDate.toISOString()})...`)

  try {
    // Clean up old quote requests that are closed
    const deletedQuotes = await prisma.quoteRequest.deleteMany({
      where: {
        status: 'CLOSED',
        submittedAt: {
          lt: cutoffDate
        }
      }
    })

    console.log(`✅ Cleaned up ${deletedQuotes.count} old quote requests`)
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    throw error
  }
}