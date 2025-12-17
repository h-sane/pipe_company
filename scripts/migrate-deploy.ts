/**
 * Production-safe database migration script
 * Applies pending migrations with safety checks
 */

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection verified')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

async function createBackup(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.log('\n📦 Creating database backup before migration...')
    try {
      execSync('npm run backup', { stdio: 'inherit' })
      console.log('✅ Backup created successfully')
    } catch (error) {
      console.error('❌ Backup failed:', error)
      throw new Error('Failed to create backup. Aborting migration.')
    }
  } else {
    console.log('⚠️  Skipping backup in non-production environment')
  }
}

async function runMigrations(): Promise<void> {
  console.log('\n🔄 Running database migrations...')
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migrations applied successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw new Error('Migration failed. Database may be in an inconsistent state.')
  }
}

async function generatePrismaClient(): Promise<void> {
  console.log('\n🔨 Generating Prisma Client...')
  try {
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma Client generated successfully')
  } catch (error) {
    console.error('❌ Prisma Client generation failed:', error)
    throw new Error('Failed to generate Prisma Client')
  }
}

async function verifyMigrations(): Promise<void> {
  console.log('\n🔍 Verifying database schema...')
  try {
    // Test that we can query critical tables
    await prisma.product.findFirst()
    await prisma.user.findFirst()
    await prisma.quoteRequest.findFirst()
    console.log('✅ Database schema verified')
  } catch (error) {
    console.error('❌ Schema verification failed:', error)
    throw new Error('Database schema verification failed')
  }
}

async function main() {
  console.log('🚀 Database Migration Deployment\n')
  console.log('='.repeat(50))
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('='.repeat(50))

  try {
    // Step 1: Check database connection
    console.log('\n1️⃣  Checking database connection...')
    const connected = await checkDatabaseConnection()
    if (!connected) {
      throw new Error('Cannot proceed without database connection')
    }

    // Step 2: Create backup (production only)
    console.log('\n2️⃣  Backup phase...')
    await createBackup()

    // Step 3: Run migrations
    console.log('\n3️⃣  Migration phase...')
    await runMigrations()

    // Step 4: Generate Prisma Client
    console.log('\n4️⃣  Client generation phase...')
    await generatePrismaClient()

    // Step 5: Verify migrations
    console.log('\n5️⃣  Verification phase...')
    await verifyMigrations()

    console.log('\n' + '='.repeat(50))
    console.log('✅ Migration deployment completed successfully!')
    console.log('🎉 Database is ready for production\n')
    process.exit(0)
  } catch (error) {
    console.error('\n' + '='.repeat(50))
    console.error('❌ Migration deployment failed!')
    console.error(error instanceof Error ? error.message : 'Unknown error')
    console.error('\n⚠️  Please check the error above and restore from backup if necessary\n')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
