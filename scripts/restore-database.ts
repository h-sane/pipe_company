#!/usr/bin/env ts-node

/**
 * Database restore script
 * Restores database from a specific backup (point-in-time recovery)
 * 
 * Usage:
 *   npm run restore <backup-id>
 *   or
 *   ts-node scripts/restore-database.ts <backup-id>
 */

import { restoreBackup, listBackups, validateDataConsistency } from '../src/lib/backup-utils'
import * as readline from 'readline'

async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

async function main() {
  console.log('=== Database Restore Script ===')
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log('')
  
  try {
    // Get backup ID from command line arguments
    const backupId = process.argv[2]
    
    if (!backupId) {
      console.log('Available backups:')
      console.log('')
      
      const backups = await listBackups()
      
      if (backups.length === 0) {
        console.log('No backups found.')
        process.exit(1)
      }
      
      backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.id}`)
        console.log(`   Timestamp: ${backup.timestamp.toISOString()}`)
        console.log(`   Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`)
        console.log(`   Database Version: ${backup.databaseVersion}`)
        console.log('')
      })
      
      console.log('Usage: npm run restore <backup-id>')
      console.log('Example: npm run restore backup_2024-01-15T10-30-00-000Z')
      process.exit(1)
    }
    
    // Confirm restoration
    console.log(`⚠️  WARNING: This will restore the database to backup: ${backupId}`)
    console.log('⚠️  All current data will be replaced with the backup data.')
    console.log('')
    
    const confirmed = await promptConfirmation('Are you sure you want to proceed?')
    
    if (!confirmed) {
      console.log('Restore cancelled.')
      process.exit(0)
    }
    
    console.log('')
    console.log('Starting restore process...')
    console.log('')
    
    // Restore backup
    await restoreBackup(backupId)
    console.log('✓ Database restored successfully')
    console.log('')
    
    // Validate data consistency after restore
    console.log('Validating data consistency...')
    const validation = await validateDataConsistency()
    
    if (!validation.isValid) {
      console.warn('⚠️  Data consistency issues detected after restore:')
      validation.errors.forEach(error => console.warn(`  - ${error}`))
    } else {
      console.log('✓ Data consistency validated successfully')
    }
    
    console.log('')
    console.log('=== Restore completed successfully ===')
    console.log(`Finished at: ${new Date().toISOString()}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Restore failed:', error)
    process.exit(1)
  }
}

main()
