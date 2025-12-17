/**
 * Product validation utilities and error handling
 * Implements validation for product specifications and audit logging
 */

// Define enum values for validation
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

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ProductData {
  name?: string
  description?: string
  category?: string
  brand?: string
  diameter?: string
  length?: string
  material?: string
  pressureRating?: string
  temperature?: string
  standards?: string[]
  applications?: string[]
  basePrice?: number
  currency?: string
  pricePerUnit?: string
  availability?: string
  bulkDiscounts?: Array<{
    minQuantity: number
    discount: number
  }>
}

export interface AuditLogEntry {
  id: string
  productId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  userId: string
  changes: Record<string, { from: any; to: any }>
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

/**
 * Validates product data for creation or update
 */
export function validateProductData(data: ProductData, isUpdate: boolean = false): ValidationResult {
  const errors: ValidationError[] = []

  // Required field validation (only for creation)
  if (!isUpdate) {
    const requiredFields = [
      'name', 'description', 'category', 'brand', 'diameter', 
      'length', 'material', 'pressureRating', 'temperature', 
      'basePrice', 'pricePerUnit'
    ]

    for (const field of requiredFields) {
      if (!data[field as keyof ProductData]) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD_MISSING'
        })
      }
    }
  }

  // Name validation
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Product name must be a non-empty string',
        code: 'INVALID_NAME'
      })
    } else if (data.name.length > 255) {
      errors.push({
        field: 'name',
        message: 'Product name must be 255 characters or less',
        code: 'NAME_TOO_LONG'
      })
    }
  }

  // Description validation
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        code: 'INVALID_DESCRIPTION'
      })
    } else if (data.description.length > 2000) {
      errors.push({
        field: 'description',
        message: 'Description must be 2000 characters or less',
        code: 'DESCRIPTION_TOO_LONG'
      })
    }
  }

  // Category validation
  if (data.category !== undefined) {
    if (!Object.values(ProductCategory).includes(data.category as any)) {
      errors.push({
        field: 'category',
        message: `Category must be one of: ${Object.values(ProductCategory).join(', ')}`,
        code: 'INVALID_CATEGORY'
      })
    }
  }

  // Brand validation
  if (data.brand !== undefined) {
    if (typeof data.brand !== 'string' || data.brand.trim().length === 0) {
      errors.push({
        field: 'brand',
        message: 'Brand must be a non-empty string',
        code: 'INVALID_BRAND'
      })
    } else if (data.brand.length > 100) {
      errors.push({
        field: 'brand',
        message: 'Brand must be 100 characters or less',
        code: 'BRAND_TOO_LONG'
      })
    }
  }

  // Specification field validation (diameter, length, material, etc.)
  const specFields = ['diameter', 'length', 'material', 'pressureRating', 'temperature', 'pricePerUnit']
  for (const field of specFields) {
    const value = data[field as keyof ProductData]
    if (value !== undefined) {
      if (typeof value !== 'string' || value.trim().length === 0) {
        errors.push({
          field,
          message: `${field} must be a non-empty string`,
          code: 'INVALID_SPECIFICATION'
        })
      } else if (value.length > 100) {
        errors.push({
          field,
          message: `${field} must be 100 characters or less`,
          code: 'SPECIFICATION_TOO_LONG'
        })
      }
    }
  }

  // Base price validation
  if (data.basePrice !== undefined) {
    if (typeof data.basePrice !== 'number' || isNaN(data.basePrice)) {
      errors.push({
        field: 'basePrice',
        message: 'Base price must be a valid number',
        code: 'INVALID_PRICE'
      })
    } else if (data.basePrice < 0) {
      errors.push({
        field: 'basePrice',
        message: 'Base price must be positive',
        code: 'NEGATIVE_PRICE'
      })
    } else if (data.basePrice > 1000000) {
      errors.push({
        field: 'basePrice',
        message: 'Base price must be less than $1,000,000',
        code: 'PRICE_TOO_HIGH'
      })
    }
  }

  // Currency validation
  if (data.currency !== undefined) {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    if (!validCurrencies.includes(data.currency)) {
      errors.push({
        field: 'currency',
        message: `Currency must be one of: ${validCurrencies.join(', ')}`,
        code: 'INVALID_CURRENCY'
      })
    }
  }

  // Availability validation
  if (data.availability !== undefined) {
    if (!Object.values(AvailabilityStatus).includes(data.availability as any)) {
      errors.push({
        field: 'availability',
        message: `Availability must be one of: ${Object.values(AvailabilityStatus).join(', ')}`,
        code: 'INVALID_AVAILABILITY'
      })
    }
  }

  // Standards validation
  if (data.standards !== undefined) {
    if (!Array.isArray(data.standards)) {
      errors.push({
        field: 'standards',
        message: 'Standards must be an array',
        code: 'INVALID_STANDARDS'
      })
    } else {
      for (let i = 0; i < data.standards.length; i++) {
        if (typeof data.standards[i] !== 'string' || data.standards[i].trim().length === 0) {
          errors.push({
            field: `standards[${i}]`,
            message: 'Each standard must be a non-empty string',
            code: 'INVALID_STANDARD'
          })
        }
      }
    }
  }

  // Applications validation
  if (data.applications !== undefined) {
    if (!Array.isArray(data.applications)) {
      errors.push({
        field: 'applications',
        message: 'Applications must be an array',
        code: 'INVALID_APPLICATIONS'
      })
    } else {
      for (let i = 0; i < data.applications.length; i++) {
        if (typeof data.applications[i] !== 'string' || data.applications[i].trim().length === 0) {
          errors.push({
            field: `applications[${i}]`,
            message: 'Each application must be a non-empty string',
            code: 'INVALID_APPLICATION'
          })
        }
      }
    }
  }

  // Bulk discounts validation
  if (data.bulkDiscounts !== undefined) {
    if (!Array.isArray(data.bulkDiscounts)) {
      errors.push({
        field: 'bulkDiscounts',
        message: 'Bulk discounts must be an array',
        code: 'INVALID_BULK_DISCOUNTS'
      })
    } else {
      for (let i = 0; i < data.bulkDiscounts.length; i++) {
        const discount = data.bulkDiscounts[i]
        
        if (typeof discount.minQuantity !== 'number' || discount.minQuantity < 1) {
          errors.push({
            field: `bulkDiscounts[${i}].minQuantity`,
            message: 'Minimum quantity must be a positive integer',
            code: 'INVALID_MIN_QUANTITY'
          })
        }
        
        if (typeof discount.discount !== 'number' || discount.discount < 0 || discount.discount > 1) {
          errors.push({
            field: `bulkDiscounts[${i}].discount`,
            message: 'Discount must be a number between 0 and 1',
            code: 'INVALID_DISCOUNT'
          })
        }
      }
      
      // Check for duplicate minimum quantities
      const minQuantities = data.bulkDiscounts.map(d => d.minQuantity)
      const uniqueQuantities = new Set(minQuantities)
      if (minQuantities.length !== uniqueQuantities.size) {
        errors.push({
          field: 'bulkDiscounts',
          message: 'Bulk discounts cannot have duplicate minimum quantities',
          code: 'DUPLICATE_MIN_QUANTITIES'
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Creates an audit log entry for product changes
 */
export function createAuditLogEntry(
  productId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  userId: string,
  oldData: any = null,
  newData: any = null,
  metadata: { ipAddress?: string; userAgent?: string } = {}
): AuditLogEntry {
  const changes: Record<string, { from: any; to: any }> = {}

  if (action === 'CREATE') {
    // For creation, all fields are "new"
    if (newData) {
      Object.keys(newData).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          changes[key] = { from: null, to: newData[key] }
        }
      })
    }
  } else if (action === 'UPDATE' && oldData && newData) {
    // For updates, track what changed
    Object.keys(newData).forEach(key => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        const oldValue = oldData[key]
        const newValue = newData[key]
        
        // Handle array comparison
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = { from: oldValue, to: newValue }
          }
        } else if (oldValue !== newValue) {
          changes[key] = { from: oldValue, to: newValue }
        }
      }
    })
  } else if (action === 'DELETE') {
    // For deletion, all fields are "removed"
    if (oldData) {
      Object.keys(oldData).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          changes[key] = { from: oldData[key], to: null }
        }
      })
    }
  }

  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    productId,
    action,
    userId,
    changes,
    timestamp: new Date(),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  }
}

/**
 * Formats validation errors for API responses
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  
  if (errors.length === 1) {
    return errors[0].message
  }
  
  return `Multiple validation errors: ${errors.map(e => `${e.field}: ${e.message}`).join('; ')}`
}

/**
 * Sanitizes product data by trimming strings and normalizing values
 */
export function sanitizeProductData(data: ProductData): ProductData {
  const sanitized: ProductData = {}

  // Trim string fields
  const stringFields = ['name', 'description', 'brand', 'diameter', 'length', 'material', 'pressureRating', 'temperature', 'currency', 'pricePerUnit']
  
  for (const field of stringFields) {
    const value = data[field as keyof ProductData]
    if (typeof value === 'string') {
      (sanitized as any)[field] = value.trim()
    } else if (value !== undefined) {
      (sanitized as any)[field] = value
    }
  }

  // Handle arrays
  if (data.standards) {
    sanitized.standards = data.standards.map(s => s.trim()).filter(s => s.length > 0)
  }
  
  if (data.applications) {
    sanitized.applications = data.applications.map(a => a.trim()).filter(a => a.length > 0)
  }

  // Handle other fields
  if (data.category !== undefined) sanitized.category = data.category
  if (data.availability !== undefined) sanitized.availability = data.availability
  if (data.basePrice !== undefined) sanitized.basePrice = data.basePrice
  if (data.bulkDiscounts !== undefined) sanitized.bulkDiscounts = data.bulkDiscounts

  return sanitized
}