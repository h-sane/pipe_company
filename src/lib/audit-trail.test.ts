/**
 * Property-based tests for audit trail maintenance
 * **Feature: pipe-supply-website, Property 10: Audit trail maintenance**
 * **Validates: Requirements 4.4**
 */

import * as fc from 'fast-check'
import { createAuditLogEntry, AuditLogEntry } from './product-validation'

// Define enum values for testing
const ProductCategory = {
  STEEL_PIPE: 'STEEL_PIPE',
  PVC_PIPE: 'PVC_PIPE',
  COPPER_PIPE: 'COPPER_PIPE',
  GALVANIZED_PIPE: 'GALVANIZED_PIPE',
  CAST_IRON_PIPE: 'CAST_IRON_PIPE',
  FLEXIBLE_PIPE: 'FLEXIBLE_PIPE',
  SPECIALTY_PIPE: 'SPECIALTY_PIPE'
} as const

const AvailabilityStatus = {
  IN_STOCK: 'IN_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
  SPECIAL_ORDER: 'SPECIAL_ORDER',
  LOW_STOCK: 'LOW_STOCK'
} as const

// Product data generator for property-based testing
const productDataGenerator = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }).filter((s: string): s is string => s.trim().length > 0),
  description: fc.string(),
  category: fc.constantFrom(...Object.values(ProductCategory)),
  brand: fc.string({ minLength: 1 }).filter((s: string): s is string => s.trim().length > 0),
  diameter: fc.string({ minLength: 1 }).filter((s: string): s is string => s.trim().length > 0),
  length: fc.string({ minLength: 1 }).filter((s: string): s is string => s.trim().length > 0),
  material: fc.string({ minLength: 1 }).filter((s: string): s is string => s.trim().length > 0),
  pressureRating: fc.string({ minLength: 1 }).filter((s: string): s is string => s.trim().length > 0),
  temperature: fc.string({ minLength: 1 }).filter((s: string): s is string => s.trim().length > 0),
  standards: fc.array(fc.string()),
  applications: fc.array(fc.string()),
  basePrice: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) }),
  currency: fc.constant('USD'),
  pricePerUnit: fc.string({ minLength: 1 }).filter((s: string): s is string => s.trim().length > 0),
  availability: fc.constantFrom(...Object.values(AvailabilityStatus)),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

// User ID generator
const userIdGenerator = fc.string({ minLength: 1 })

// Metadata generator
const metadataGenerator = fc.record({
  ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
  userAgent: fc.option(fc.string(), { nil: undefined })
})

describe('Audit Trail Property Tests', () => {
  it('Property 10: Audit trail maintenance - CREATE action records all new fields', () => {
    // **Feature: pipe-supply-website, Property 10: Audit trail maintenance**
    // **Validates: Requirements 4.4**
    
    fc.assert(
      fc.property(
        productDataGenerator,
        userIdGenerator,
        metadataGenerator,
        (productData, userId, metadata) => {
          // Create audit log for product creation
          const auditEntry = createAuditLogEntry(
            productData.id,
            'CREATE',
            userId,
            null,
            productData,
            metadata
          )
          
          // Property 1: Audit entry should have a unique ID
          const hasValidId = Boolean(auditEntry.id && typeof auditEntry.id === 'string' && auditEntry.id.length > 0)
          
          // Property 2: Audit entry should record the product ID
          const hasCorrectProductId = auditEntry.productId === productData.id
          
          // Property 3: Audit entry should record the action as CREATE
          const hasCorrectAction = auditEntry.action === 'CREATE'
          
          // Property 4: Audit entry should record the user ID
          const hasCorrectUserId = auditEntry.userId === userId
          
          // Property 5: Audit entry should have a timestamp
          const hasValidTimestamp = auditEntry.timestamp instanceof Date && !isNaN(auditEntry.timestamp.getTime())
          
          // Property 6: For CREATE, all fields (except id, createdAt, updatedAt) should be in changes with from=null
          const allFieldsRecorded = Object.keys(productData).every(key => {
            if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
              // These fields should NOT be in changes
              return !auditEntry.changes.hasOwnProperty(key)
            }
            // All other fields should be in changes with from=null
            return auditEntry.changes.hasOwnProperty(key) && 
                   auditEntry.changes[key].from === null &&
                   JSON.stringify(auditEntry.changes[key].to) === JSON.stringify((productData as any)[key])
          })
          
          // Property 7: Metadata should be preserved if provided
          const metadataPreserved = 
            (metadata.ipAddress === undefined || auditEntry.ipAddress === metadata.ipAddress) &&
            (metadata.userAgent === undefined || auditEntry.userAgent === metadata.userAgent)
          
          return hasValidId && 
                 hasCorrectProductId && 
                 hasCorrectAction && 
                 hasCorrectUserId && 
                 hasValidTimestamp && 
                 allFieldsRecorded && 
                 metadataPreserved
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10a: Audit trail maintenance - UPDATE action records only changed fields', () => {
    // **Feature: pipe-supply-website, Property 10a: Audit trail UPDATE tracking**
    
    fc.assert(
      fc.property(
        productDataGenerator,
        productDataGenerator,
        userIdGenerator,
        metadataGenerator,
        (oldData, newData, userId, metadata) => {
          // Ensure they have the same ID
          const productId = oldData.id
          const updatedNewData = { ...newData, id: productId }
          
          // Create audit log for product update
          const auditEntry = createAuditLogEntry(
            productId,
            'UPDATE',
            userId,
            oldData,
            updatedNewData,
            metadata
          )
          
          // Property 1: Audit entry should record the action as UPDATE
          const hasCorrectAction = auditEntry.action === 'UPDATE'
          
          // Property 2: Only changed fields should be in changes
          const onlyChangedFieldsRecorded = Object.keys(auditEntry.changes).every(key => {
            const oldValue = (oldData as any)[key]
            const newValue = (updatedNewData as any)[key]
            
            // For arrays, compare stringified versions
            if (Array.isArray(oldValue) && Array.isArray(newValue)) {
              return JSON.stringify(oldValue) !== JSON.stringify(newValue)
            }
            
            // For other types, direct comparison
            return oldValue !== newValue
          })
          
          // Property 3: All changed fields should be recorded
          const allChangedFieldsRecorded = Object.keys(updatedNewData).every(key => {
            if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
              return true // These are excluded from changes
            }
            
            const oldValue = (oldData as any)[key]
            const newValue = (updatedNewData as any)[key]
            
            // Check if values are different
            let isDifferent = false
            if (Array.isArray(oldValue) && Array.isArray(newValue)) {
              isDifferent = JSON.stringify(oldValue) !== JSON.stringify(newValue)
            } else {
              isDifferent = oldValue !== newValue
            }
            
            // If different, should be in changes
            if (isDifferent) {
              return auditEntry.changes.hasOwnProperty(key) &&
                     JSON.stringify(auditEntry.changes[key].from) === JSON.stringify(oldValue) &&
                     JSON.stringify(auditEntry.changes[key].to) === JSON.stringify(newValue)
            }
            
            // If not different, should NOT be in changes
            return !auditEntry.changes.hasOwnProperty(key)
          })
          
          // Property 4: Timestamp should be valid
          const hasValidTimestamp = auditEntry.timestamp instanceof Date && !isNaN(auditEntry.timestamp.getTime())
          
          return hasCorrectAction && 
                 onlyChangedFieldsRecorded && 
                 allChangedFieldsRecorded && 
                 hasValidTimestamp
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10b: Audit trail maintenance - DELETE action records all removed fields', () => {
    // **Feature: pipe-supply-website, Property 10b: Audit trail DELETE tracking**
    
    fc.assert(
      fc.property(
        productDataGenerator,
        userIdGenerator,
        metadataGenerator,
        (productData, userId, metadata) => {
          // Create audit log for product deletion
          const auditEntry = createAuditLogEntry(
            productData.id,
            'DELETE',
            userId,
            productData,
            null,
            metadata
          )
          
          // Property 1: Audit entry should record the action as DELETE
          const hasCorrectAction = auditEntry.action === 'DELETE'
          
          // Property 2: For DELETE, all fields (except id, createdAt, updatedAt) should be in changes with to=null
          const allFieldsRecorded = Object.keys(productData).every(key => {
            if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
              // These fields should NOT be in changes
              return !auditEntry.changes.hasOwnProperty(key)
            }
            // All other fields should be in changes with to=null
            return auditEntry.changes.hasOwnProperty(key) && 
                   JSON.stringify(auditEntry.changes[key].from) === JSON.stringify((productData as any)[key]) &&
                   auditEntry.changes[key].to === null
          })
          
          // Property 3: Timestamp should be valid
          const hasValidTimestamp = auditEntry.timestamp instanceof Date && !isNaN(auditEntry.timestamp.getTime())
          
          return hasCorrectAction && allFieldsRecorded && hasValidTimestamp
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10c: Audit trail maintains chronological ordering', () => {
    // **Feature: pipe-supply-website, Property 10c: Audit trail chronological ordering**
    
    fc.assert(
      fc.property(
        productDataGenerator,
        userIdGenerator,
        fc.array(fc.record({
          field: fc.constantFrom('name', 'basePrice', 'availability', 'description'),
          value: fc.oneof(
            fc.string({ minLength: 1 }),
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000) }),
            fc.constantFrom(...Object.values(AvailabilityStatus))
          )
        }), { minLength: 1, maxLength: 5 }),
        (initialData, userId, updates) => {
          const auditEntries: AuditLogEntry[] = []
          let currentData = { ...initialData }
          
          // Create initial audit entry
          const createEntry = createAuditLogEntry(
            initialData.id,
            'CREATE',
            userId,
            null,
            initialData,
            {}
          )
          auditEntries.push(createEntry)
          
          // Apply updates and create audit entries
          for (const update of updates) {
            const oldData = { ...currentData }
            const newData = { ...currentData, [update.field]: update.value }
            
            // Small delay to ensure different timestamps
            const updateEntry = createAuditLogEntry(
              initialData.id,
              'UPDATE',
              userId,
              oldData,
              newData,
              {}
            )
            auditEntries.push(updateEntry)
            currentData = newData
          }
          
          // Property: Audit entries should be in chronological order (or at least non-decreasing)
          const isChronological = auditEntries.every((entry, index) => {
            if (index === 0) return true
            return entry.timestamp.getTime() >= auditEntries[index - 1].timestamp.getTime()
          })
          
          // Property: Each audit entry should have a unique ID
          const uniqueIds = new Set(auditEntries.map(e => e.id))
          const hasUniqueIds = uniqueIds.size === auditEntries.length
          
          // Property: All audit entries should reference the same product
          const sameProductId = auditEntries.every(e => e.productId === initialData.id)
          
          return isChronological && hasUniqueIds && sameProductId
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10d: Audit trail preserves data integrity', () => {
    // **Feature: pipe-supply-website, Property 10d: Audit trail data integrity**
    
    fc.assert(
      fc.property(
        productDataGenerator,
        productDataGenerator,
        userIdGenerator,
        (oldData, newData, userId) => {
          // Ensure same ID
          const productId = oldData.id
          const updatedNewData = { ...newData, id: productId }
          
          // Create audit entry
          const auditEntry = createAuditLogEntry(
            productId,
            'UPDATE',
            userId,
            oldData,
            updatedNewData,
            {}
          )
          
          // Property 1: Reconstructing new state from old state + changes should match new data
          const reconstructedData = { ...oldData } as any
          Object.entries(auditEntry.changes).forEach(([key, change]) => {
            reconstructedData[key] = change.to
          })
          
          // Verify all changed fields match
          const reconstructionMatches = Object.keys(auditEntry.changes).every(key => {
            return JSON.stringify(reconstructedData[key]) === JSON.stringify((updatedNewData as any)[key])
          })
          
          // Property 2: Unchanged fields should remain the same
          const unchangedFieldsPreserved = Object.keys(oldData).every(key => {
            if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return true
            if (auditEntry.changes.hasOwnProperty(key)) return true // This field changed
            
            // This field didn't change, so it should be the same in both old and new
            return JSON.stringify((oldData as any)[key]) === JSON.stringify((updatedNewData as any)[key])
          })
          
          return reconstructionMatches && unchangedFieldsPreserved
        }
      ),
      { numRuns: 100 }
    )
  })
})
