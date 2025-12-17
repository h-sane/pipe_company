/**
 * Database backup and recovery utilities
 * Implements automated backup, point-in-time recovery, and data consistency validation
 * Requirements: 7.3
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from './prisma'

const execAsync = promisify(exec)

// Backup configuration
export interface BackupConfig {
  backupDir: string
  retentionDays: number
  compressionEnabled: boolean
  encryptionEnabled: boolean
}

// Default backup configuration
const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  compressionEnabled: process.env.BACKUP_COMPRESSION === 'true',
  encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true'
}

// Backup metadata
export interface BackupMetadata {
  id: string
  timestamp: Date
  size: number
  checksum: string
  compressed: boolean
  encrypted: boolean
  databaseVersion: string
}

/**
 * Create a database backup
 * Supports PostgreSQL pg_dump for full database backup
 */
export async function createBackup(
  config: BackupConfig = DEFAULT_BACKUP_CONFIG
): Promise<BackupMetadata> {
  try {
    // Ensure backup directory exists
    await fs.mkdir(config.backupDir, { recursive: true })
    
    // Generate backup filename with timestamp
    const timestamp = new Date()
    const backupId = `backup_${timestamp.toISOString().replace(/[:.]/g, '-')}`
    const backupFile = path.join(config.backupDir, `${backupId}.sql`)
    
    // Get database connection details from environment
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    
    // Parse database URL
    const dbUrlObj = new URL(dbUrl)
    const dbHost = dbUrlObj.hostname
    const dbPort = dbUrlObj.port || '5432'
    const dbName = dbUrlObj.pathname.slice(1)
    const dbUser = dbUrlObj.username
    const dbPassword = dbUrlObj.password
    
    // Create pg_dump command
    const pgDumpCmd = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${backupFile}"`
    
    console.log(`Creating database backup: ${backupId}`)
    
    // Execute backup command
    await execAsync(pgDumpCmd)
    
    // Get file size
    const stats = await fs.stat(backupFile)
    const fileSize = stats.size
    
    // Calculate checksum for integrity verification
    const checksum = await calculateFileChecksum(backupFile)
    
    // Compress if enabled
    let finalFile = backupFile
    if (config.compressionEnabled) {
      finalFile = await compressBackup(backupFile)
      await fs.unlink(backupFile) // Remove uncompressed file
    }
    
    // Get database version
    const dbVersion = await getDatabaseVersion()
    
    // Create metadata
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      size: fileSize,
      checksum,
      compressed: config.compressionEnabled,
      encrypted: config.encryptionEnabled,
      databaseVersion: dbVersion
    }
    
    // Save metadata
    await saveBackupMetadata(metadata, config.backupDir)
    
    console.log(`Backup created successfully: ${backupId}`)
    console.log(`Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)
    
    return metadata
  } catch (error) {
    console.error('Backup creation failed:', error)
    throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Restore database from backup
 * Supports point-in-time recovery by restoring to a specific backup
 */
export async function restoreBackup(
  backupId: string,
  config: BackupConfig = DEFAULT_BACKUP_CONFIG
): Promise<void> {
  try {
    console.log(`Restoring database from backup: ${backupId}`)
    
    // Load backup metadata
    const metadata = await loadBackupMetadata(backupId, config.backupDir)
    
    if (!metadata) {
      throw new Error(`Backup not found: ${backupId}`)
    }
    
    // Determine backup file path
    let backupFile = path.join(
      config.backupDir,
      `${backupId}.sql${metadata.compressed ? '.gz' : ''}`
    )
    
    // Decompress if needed
    if (metadata.compressed) {
      backupFile = await decompressBackup(backupFile)
    }
    
    // Verify backup integrity
    const isValid = await verifyBackupIntegrity(backupFile, metadata.checksum)
    if (!isValid) {
      throw new Error('Backup integrity check failed - file may be corrupted')
    }
    
    // Get database connection details
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    
    const dbUrlObj = new URL(dbUrl)
    const dbHost = dbUrlObj.hostname
    const dbPort = dbUrlObj.port || '5432'
    const dbName = dbUrlObj.pathname.slice(1)
    const dbUser = dbUrlObj.username
    const dbPassword = dbUrlObj.password
    
    // Create psql restore command
    const psqlCmd = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${backupFile}"`
    
    // Execute restore command
    await execAsync(psqlCmd)
    
    // Clean up decompressed file if it was created
    if (metadata.compressed) {
      await fs.unlink(backupFile)
    }
    
    console.log(`Database restored successfully from backup: ${backupId}`)
  } catch (error) {
    console.error('Backup restoration failed:', error)
    throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * List all available backups
 */
export async function listBackups(
  config: BackupConfig = DEFAULT_BACKUP_CONFIG
): Promise<BackupMetadata[]> {
  try {
    const backupDir = config.backupDir
    
    // Check if backup directory exists
    try {
      await fs.access(backupDir)
    } catch {
      return [] // No backups directory yet
    }
    
    // Read all metadata files
    const files = await fs.readdir(backupDir)
    const metadataFiles = files.filter(f => f.endsWith('.metadata.json'))
    
    const backups: BackupMetadata[] = []
    
    for (const file of metadataFiles) {
      const metadataPath = path.join(backupDir, file)
      const content = await fs.readFile(metadataPath, 'utf-8')
      const metadata = JSON.parse(content) as BackupMetadata
      
      // Convert timestamp string back to Date
      metadata.timestamp = new Date(metadata.timestamp)
      
      backups.push(metadata)
    }
    
    // Sort by timestamp (newest first)
    backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return backups
  } catch (error) {
    console.error('Failed to list backups:', error)
    throw new Error(`Failed to list backups: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(
  config: BackupConfig = DEFAULT_BACKUP_CONFIG
): Promise<number> {
  try {
    const backups = await listBackups(config)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays)
    
    let deletedCount = 0
    
    for (const backup of backups) {
      if (backup.timestamp < cutoffDate) {
        await deleteBackup(backup.id, config)
        deletedCount++
      }
    }
    
    console.log(`Cleaned up ${deletedCount} old backup(s)`)
    return deletedCount
  } catch (error) {
    console.error('Backup cleanup failed:', error)
    throw new Error(`Failed to cleanup backups: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Delete a specific backup
 */
export async function deleteBackup(
  backupId: string,
  config: BackupConfig = DEFAULT_BACKUP_CONFIG
): Promise<void> {
  try {
    const metadata = await loadBackupMetadata(backupId, config.backupDir)
    
    if (!metadata) {
      throw new Error(`Backup not found: ${backupId}`)
    }
    
    // Delete backup file
    const backupFile = path.join(
      config.backupDir,
      `${backupId}.sql${metadata.compressed ? '.gz' : ''}`
    )
    
    try {
      await fs.unlink(backupFile)
    } catch (error) {
      console.warn(`Backup file not found: ${backupFile}`)
    }
    
    // Delete metadata file
    const metadataFile = path.join(config.backupDir, `${backupId}.metadata.json`)
    await fs.unlink(metadataFile)
    
    console.log(`Deleted backup: ${backupId}`)
  } catch (error) {
    console.error('Backup deletion failed:', error)
    throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Validate data consistency across the database
 * Checks referential integrity and data constraints
 */
export async function validateDataConsistency(): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const errors: string[] = []
  
  try {
    // Check for orphaned records in key relationships
    
    // 1. Check for products with invalid media references
    const orphanedProductMedia = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT p.id 
      FROM "Product" p
      LEFT JOIN "ProductImage" pi ON p.id = pi."productId"
      WHERE pi.id IS NULL AND p."imageCount" > 0
    `
    
    if (orphanedProductMedia.length > 0) {
      errors.push(`Found ${orphanedProductMedia.length} products with invalid media references`)
    }
    
    // 2. Check for quotes with invalid product references
    const orphanedQuoteProducts = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT qp.id
      FROM "QuoteProduct" qp
      LEFT JOIN "Product" p ON qp."productId" = p.id
      WHERE p.id IS NULL
    `
    
    if (orphanedQuoteProducts.length > 0) {
      errors.push(`Found ${orphanedQuoteProducts.length} quote items with invalid product references`)
    }
    
    // 3. Check for media files with invalid product references
    const orphanedMedia = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT pi.id
      FROM "ProductImage" pi
      LEFT JOIN "Product" p ON pi."productId" = p.id
      WHERE p.id IS NULL
    `
    
    if (orphanedMedia.length > 0) {
      errors.push(`Found ${orphanedMedia.length} media files with invalid product references`)
    }
    
    // 4. Validate data constraints
    const invalidProducts = await prisma.product.count({
      where: {
        OR: [
          { name: '' },
          { basePrice: { lt: 0 } }
        ]
      }
    })
    
    if (invalidProducts > 0) {
      errors.push(`Found ${invalidProducts} products with invalid data`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    console.error('Data consistency validation failed:', error)
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}

// Helper functions

async function calculateFileChecksum(filePath: string): Promise<string> {
  const crypto = await import('crypto')
  const fileBuffer = await fs.readFile(filePath)
  const hash = crypto.createHash('sha256')
  hash.update(fileBuffer)
  return hash.digest('hex')
}

async function compressBackup(filePath: string): Promise<string> {
  const zlib = await import('zlib')
  const { pipeline } = await import('stream/promises')
  
  const compressedPath = `${filePath}.gz`
  const readStream = (await import('fs')).createReadStream(filePath)
  const writeStream = (await import('fs')).createWriteStream(compressedPath)
  const gzip = zlib.createGzip()
  
  await pipeline(readStream, gzip, writeStream)
  
  return compressedPath
}

async function decompressBackup(filePath: string): Promise<string> {
  const zlib = await import('zlib')
  const { pipeline } = await import('stream/promises')
  
  const decompressedPath = filePath.replace('.gz', '')
  const readStream = (await import('fs')).createReadStream(filePath)
  const writeStream = (await import('fs')).createWriteStream(decompressedPath)
  const gunzip = zlib.createGunzip()
  
  await pipeline(readStream, gunzip, writeStream)
  
  return decompressedPath
}

async function verifyBackupIntegrity(
  filePath: string,
  expectedChecksum: string
): Promise<boolean> {
  const actualChecksum = await calculateFileChecksum(filePath)
  return actualChecksum === expectedChecksum
}

async function saveBackupMetadata(
  metadata: BackupMetadata,
  backupDir: string
): Promise<void> {
  const metadataPath = path.join(backupDir, `${metadata.id}.metadata.json`)
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
}

async function loadBackupMetadata(
  backupId: string,
  backupDir: string
): Promise<BackupMetadata | null> {
  try {
    const metadataPath = path.join(backupDir, `${backupId}.metadata.json`)
    const content = await fs.readFile(metadataPath, 'utf-8')
    const metadata = JSON.parse(content) as BackupMetadata
    metadata.timestamp = new Date(metadata.timestamp)
    return metadata
  } catch {
    return null
  }
}

async function getDatabaseVersion(): Promise<string> {
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`
    return result[0]?.version || 'unknown'
  } catch {
    return 'unknown'
  }
}
