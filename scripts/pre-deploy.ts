/**
 * Pre-deployment validation script
 * Verifies environment configuration and database connectivity
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

async function validateEnvironment(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  }

  console.log('🔍 Validating environment configuration...\n')

  // Check required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'ENCRYPTION_KEY',
  ]

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      result.valid = false
      result.errors.push(`Missing required environment variable: ${varName}`)
    }
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Running in production mode')
    
    // Production-specific checks
    if (process.env.NEXTAUTH_SECRET === 'your-secret-key-here') {
      result.valid = false
      result.errors.push('NEXTAUTH_SECRET must be changed from default value in production')
    }

    if (process.env.ENCRYPTION_KEY === 'your-64-character-hex-encryption-key-here') {
      result.valid = false
      result.errors.push('ENCRYPTION_KEY must be changed from default value in production')
    }

    if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
      result.warnings.push('NEXTAUTH_URL should use HTTPS in production')
    }
  } else {
    console.log(`⚠️  Running in ${process.env.NODE_ENV || 'development'} mode`)
  }

  // Check database connectivity
  console.log('\n🔍 Checking database connectivity...')
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test query
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database query successful')
  } catch (error) {
    result.valid = false
    result.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Check if migrations are applied
  console.log('\n🔍 Checking database migrations...')
  try {
    const productCount = await prisma.product.count()
    const userCount = await prisma.user.count()
    console.log(`✅ Database schema is valid (${productCount} products, ${userCount} users)`)
  } catch (error) {
    result.valid = false
    result.errors.push(`Database schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

async function main() {
  console.log('🚀 Pre-deployment validation\n')
  console.log('=' .repeat(50))

  try {
    const result = await validateEnvironment()

    console.log('\n' + '='.repeat(50))
    console.log('\n📊 Validation Results:\n')

    if (result.errors.length > 0) {
      console.log('❌ ERRORS:')
      result.errors.forEach(error => console.log(`   - ${error}`))
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:')
      result.warnings.forEach(warning => console.log(`   - ${warning}`))
    }

    if (result.valid && result.errors.length === 0) {
      console.log('✅ All validation checks passed!')
      console.log('\n🎉 Ready for deployment\n')
      process.exit(0)
    } else {
      console.log('\n❌ Validation failed. Please fix the errors above before deploying.\n')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Validation script failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
