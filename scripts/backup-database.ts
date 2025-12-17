#!/usr/bin/env ts-node

/**
 * Automated database backup script
 * Can be run manually or scheduled via cron/task scheduler
 * 
 * Usage:
 *   npm run backup
 *   or
 *   ts-node scripts/backup-database.ts
 */

import { createBackup, cleanupOldBackups, validateDataConsistency } from '../src/lib/backup-utils'

async function main() {
  console.log('=== Database Backup Script ===')
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log('')
  
  try {
    // Validate data consistency before backup
    console.log('Step 1: Validating data consistency...')
    const validation = await validateDataConsistency()
    
    if (!validation.isValid) {
      console.warn('⚠️  Data consistency issues detected:')
      validation.errors.forEach(error => console.warn(`  - ${error}`))
      console.warn('Proceeding with backup anyway...')
      console.log('')
    } else {
      console.log('✓ Data consistency validated successfully')
      console.log('')
    }
    
    // Create backup
    console.log('Step 2: Creating database backup...')
    const metadata = await createBackup()
    console.log('✓ Backup created successfully')
    console.log(`  ID: ${metadata.id}`)
    console.log(`  Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`  Checksum: ${metadata.checksum.substring(0, 16)}...`)
    console.log('')
    
    // Cleanup old backups
    console.log('Step 3: Cleaning up old backups...')
    const deletedCount = await cleanupOldBackups()
    console.log(`✓ Cleaned up ${deletedCount} old backup(s)`)
    console.log('')
    
    console.log('=== Backup completed successfully ===')
    console.log(`Finished at: ${new Date().toISOString()}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  }
}

main()
