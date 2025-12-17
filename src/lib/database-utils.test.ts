/**
 * Tests for database connection and migration utilities
 */

import { checkDatabaseHealth, withRetry, safeTransaction } from './prisma'
import { getDatabaseInfo, validateDatabaseIntegrity } from './migration-utils'

// Mock Prisma for testing
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ version: 'PostgreSQL 14.0' }]),
    $transaction: jest.fn().mockImplementation((callback) => callback({})),
    user: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([]),
    },
    product: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([]),
    },
    quoteRequest: {
      count: jest.fn().mockResolvedValue(1),
    },
    media: {
      count: jest.fn().mockResolvedValue(2),
    },
    productImage: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([]),
    },
    productDocument: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([]),
    },
  })),
}))

describe('Database Connection and Migration Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Database Health Check', () => {
    it('should return healthy status when database is accessible', async () => {
      const health = await checkDatabaseHealth()
      
      expect(health.status).toBe('healthy')
      expect(health.timestamp).toBeDefined()
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed operations with exponential backoff', async () => {
      let attempts = 0
      const operation = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return Promise.resolve('success')
      })

      const result = await withRetry(operation, 3, 100)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries exceeded', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'))

      await expect(withRetry(operation, 2, 50)).rejects.toThrow('Persistent failure')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('Safe Transaction', () => {
    it('should execute transaction with retry logic', async () => {
      const callback = jest.fn().mockResolvedValue('transaction result')
      
      const result = await safeTransaction(callback)
      
      expect(result).toBe('transaction result')
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('Database Info', () => {
    it('should return comprehensive database information', async () => {
      const info = await getDatabaseInfo()
      
      expect(info.connectionStatus).toBe('connected')
      expect(info.version).toContain('PostgreSQL')
      expect(info.recordCounts).toBeDefined()
      expect(info.recordCounts.users).toBe(2)
      expect(info.recordCounts.products).toBe(3)
    })
  })

  describe('Database Integrity Validation', () => {
    it('should validate database integrity and return no issues for clean database', async () => {
      const validation = await validateDatabaseIntegrity()
      
      expect(validation.valid).toBe(true)
      expect(validation.issues).toHaveLength(0)
    })
  })
})