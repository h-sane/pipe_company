# Database Backup and Recovery Guide

This document explains how to configure and use the automated database backup and recovery system.

## Overview

The backup system provides:
- **Automated database backups** using PostgreSQL's `pg_dump`
- **Point-in-time recovery** to restore from any backup
- **Data consistency validation** to ensure database integrity
- **Automatic cleanup** of old backups based on retention policy
- **Backup compression** to save storage space
- **Integrity verification** using SHA-256 checksums

## Prerequisites

1. **PostgreSQL Client Tools**: Ensure `pg_dump` and `psql` are installed and available in your system PATH
   - Windows: Install PostgreSQL and add `C:\Program Files\PostgreSQL\<version>\bin` to PATH
   - Linux/Mac: Install via package manager (`apt-get install postgresql-client` or `brew install postgresql`)

2. **Environment Variables**: Configure the following in your `.env` file:

```env
# Database connection (required)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Backup configuration (optional - defaults shown)
BACKUP_DIR="./backups"
BACKUP_RETENTION_DAYS="30"
BACKUP_COMPRESSION="true"
BACKUP_ENCRYPTION="false"
```

## Configuration

### Backup Directory
By default, backups are stored in `./backups` relative to the project root. Change this by setting `BACKUP_DIR`:

```env
BACKUP_DIR="/var/backups/pipe-supply"
```

### Retention Policy
Backups older than the retention period are automatically deleted. Default is 30 days:

```env
BACKUP_RETENTION_DAYS="90"  # Keep backups for 90 days
```

### Compression
Enable compression to reduce backup file size (recommended):

```env
BACKUP_COMPRESSION="true"
```

## Manual Backup

Create a backup manually:

```bash
npm run backup
```

This will:
1. Validate data consistency
2. Create a full database backup
3. Calculate checksum for integrity verification
4. Compress the backup (if enabled)
5. Clean up old backups based on retention policy

## Automated Backups

### Windows Task Scheduler

1. Open Task Scheduler
2. Create a new task:
   - **Trigger**: Daily at 2:00 AM
   - **Action**: Start a program
   - **Program**: `cmd.exe`
   - **Arguments**: `/c cd /d "C:\path\to\project" && npm run backup`

### Linux/Mac Cron

Add to crontab (`crontab -e`):

```cron
# Daily backup at 2:00 AM
0 2 * * * cd /path/to/project && npm run backup >> /var/log/pipe-supply-backup.log 2>&1
```

## Point-in-Time Recovery

### List Available Backups

```bash
npm run restore
```

This displays all available backups with their timestamps and sizes.

### Restore from Backup

```bash
npm run restore backup_2024-01-15T10-30-00-000Z
```

**⚠️ WARNING**: This will replace all current database data with the backup data. Make sure you have a recent backup before restoring!

The restore process:
1. Verifies backup integrity using checksum
2. Decompresses backup (if compressed)
3. Restores database using `psql`
4. Validates data consistency after restore

## Data Consistency Validation

The system automatically validates data consistency:
- Before creating backups
- After restoring backups
- Can be run manually via the API

Validation checks:
- Orphaned records in relationships
- Invalid foreign key references
- Data constraint violations
- Referential integrity

## Backup Metadata

Each backup includes metadata stored in a `.metadata.json` file:

```json
{
  "id": "backup_2024-01-15T10-30-00-000Z",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "size": 52428800,
  "checksum": "a1b2c3d4...",
  "compressed": true,
  "encrypted": false,
  "databaseVersion": "PostgreSQL 15.3"
}
```

## Backup File Structure

```
backups/
├── backup_2024-01-15T10-30-00-000Z.sql.gz
├── backup_2024-01-15T10-30-00-000Z.metadata.json
├── backup_2024-01-16T10-30-00-000Z.sql.gz
├── backup_2024-01-16T10-30-00-000Z.metadata.json
└── ...
```

## Best Practices

1. **Test Restores Regularly**: Periodically test the restore process to ensure backups are valid
2. **Monitor Backup Size**: Watch for unexpected increases in backup size
3. **Off-site Backups**: Copy backups to a separate location or cloud storage
4. **Backup Before Major Changes**: Always create a backup before:
   - Database migrations
   - Major data imports
   - System upgrades
5. **Verify Consistency**: Review data consistency validation results
6. **Secure Backup Storage**: Ensure backup directory has appropriate permissions

## Troubleshooting

### "pg_dump: command not found"
- Install PostgreSQL client tools
- Add PostgreSQL bin directory to system PATH
- Restart terminal/command prompt

### "Permission denied" errors
- Ensure backup directory is writable
- Check database user permissions
- Verify file system permissions

### Backup takes too long
- Consider reducing `BACKUP_RETENTION_DAYS` to clean up more frequently
- Enable compression to reduce I/O time
- Schedule backups during low-traffic periods

### Restore fails with "database in use"
- Disconnect all active database connections
- Stop the application server before restoring
- Use a maintenance window for restores

## API Integration

The backup utilities can be integrated into your application:

```typescript
import { 
  createBackup, 
  restoreBackup, 
  listBackups,
  validateDataConsistency 
} from '@/lib/backup-utils'

// Create backup programmatically
const metadata = await createBackup()

// List backups
const backups = await listBackups()

// Validate consistency
const validation = await validateDataConsistency()
if (!validation.isValid) {
  console.error('Data issues:', validation.errors)
}
```

## Security Considerations

1. **Backup Encryption**: Consider enabling encryption for sensitive data
2. **Access Control**: Restrict access to backup directory
3. **Secure Transfer**: Use encrypted channels when copying backups
4. **Audit Logging**: Monitor backup and restore operations
5. **Credentials**: Never commit database credentials to version control

## Support

For issues or questions about the backup system:
1. Check the troubleshooting section above
2. Review backup logs for error messages
3. Verify PostgreSQL client tools are properly installed
4. Contact system administrator for infrastructure issues
