import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Input sanitization and validation utilities

// Sanitize HTML content
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
}

// Sanitize plain text (remove HTML and special characters)
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Remove HTML tags and decode entities
  let sanitized = validator.stripLow(input)
  sanitized = validator.escape(sanitized)
  
  return sanitized.trim()
}

// Validate and sanitize email
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null
  }
  
  const normalized = validator.normalizeEmail(email)
  
  if (!normalized || !validator.isEmail(normalized)) {
    return null
  }
  
  return normalized
}

// Validate and sanitize phone number
export function sanitizePhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null
  }
  
  // Remove all non-digit characters except + for international numbers
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Basic validation - should be between 10-15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null
  }
  
  return cleaned
}

// Validate and sanitize URL
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }
  
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false
    })) {
      return null
    }
    
    return url
  } catch {
    return null
  }
}

// Sanitize numeric input
export function sanitizeNumber(input: any, options: {
  min?: number
  max?: number
  integer?: boolean
} = {}): number | null {
  if (input === null || input === undefined || input === '') {
    return null
  }
  
  const num = Number(input)
  
  if (isNaN(num) || !isFinite(num)) {
    return null
  }
  
  if (options.integer && !Number.isInteger(num)) {
    return null
  }
  
  if (options.min !== undefined && num < options.min) {
    return null
  }
  
  if (options.max !== undefined && num > options.max) {
    return null
  }
  
  return num
}

// Sanitize file name
export function sanitizeFileName(fileName: string): string | null {
  if (!fileName || typeof fileName !== 'string') {
    return null
  }
  
  // Remove path traversal attempts and dangerous characters
  let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
  sanitized = sanitized.replace(/^\.+/, '') // Remove leading dots
  sanitized = sanitized.trim()
  
  // Ensure reasonable length
  if (sanitized.length === 0 || sanitized.length > 255) {
    return null
  }
  
  // Prevent reserved names on Windows
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  
  if (reservedNames.includes(sanitized.toUpperCase())) {
    return null
  }
  
  return sanitized
}

// Validate and sanitize JSON input
export function sanitizeJson(input: string): any | null {
  if (!input || typeof input !== 'string') {
    return null
  }
  
  try {
    const parsed = JSON.parse(input)
    
    // Recursively sanitize string values in the object
    return sanitizeObjectStrings(parsed)
  } catch {
    return null
  }
}

// Recursively sanitize string values in an object
function sanitizeObjectStrings(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectStrings)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeText(key)
      sanitized[sanitizedKey] = sanitizeObjectStrings(value)
    }
    
    return sanitized
  }
  
  return obj
}

// SQL injection prevention helpers
export function escapeSqlIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Invalid SQL identifier')
  }
  
  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error('Invalid SQL identifier format')
  }
  
  return identifier
}

// Validate pagination parameters
export function sanitizePagination(page?: any, limit?: any): {
  page: number
  limit: number
  offset: number
} {
  const sanitizedPage = sanitizeNumber(page, { min: 1, integer: true }) || 1
  const sanitizedLimit = sanitizeNumber(limit, { min: 1, max: 100, integer: true }) || 20
  
  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
    offset: (sanitizedPage - 1) * sanitizedLimit
  }
}

// Validate and sanitize search query
export function sanitizeSearchQuery(query: string): string | null {
  if (!query || typeof query !== 'string') {
    return null
  }
  
  // Remove special characters that could be used for injection
  let sanitized = query.replace(/[<>'";&|`$(){}[\]\\]/g, '')
  sanitized = sanitized.trim()
  
  // Ensure reasonable length
  if (sanitized.length === 0 || sanitized.length > 200) {
    return null
  }
  
  return sanitized
}

// Comprehensive input validation for API requests
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: any
}

export function validateApiInput(
  data: any,
  schema: Record<string, {
    required?: boolean
    type: 'string' | 'number' | 'email' | 'url' | 'phone' | 'json'
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
  }>
): ValidationResult {
  const errors: string[] = []
  const sanitizedData: any = {}
  
  // Check for required fields
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${field}' is required`)
      continue
    }
    
    if (value === undefined || value === null || value === '') {
      continue // Skip optional empty fields
    }
    
    // Type-specific validation and sanitization
    switch (rules.type) {
      case 'string':
        const sanitizedString = sanitizeText(String(value))
        
        if (rules.minLength && sanitizedString.length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters`)
        }
        
        if (rules.maxLength && sanitizedString.length > rules.maxLength) {
          errors.push(`Field '${field}' must be no more than ${rules.maxLength} characters`)
        }
        
        if (rules.pattern && !rules.pattern.test(sanitizedString)) {
          errors.push(`Field '${field}' format is invalid`)
        }
        
        sanitizedData[field] = sanitizedString
        break
        
      case 'number':
        const sanitizedNumber = sanitizeNumber(value, {
          min: rules.min,
          max: rules.max
        })
        
        if (sanitizedNumber === null) {
          errors.push(`Field '${field}' must be a valid number`)
        } else {
          sanitizedData[field] = sanitizedNumber
        }
        break
        
      case 'email':
        const sanitizedEmail = sanitizeEmail(String(value))
        
        if (!sanitizedEmail) {
          errors.push(`Field '${field}' must be a valid email address`)
        } else {
          sanitizedData[field] = sanitizedEmail
        }
        break
        
      case 'url':
        const sanitizedUrl = sanitizeUrl(String(value))
        
        if (!sanitizedUrl) {
          errors.push(`Field '${field}' must be a valid URL`)
        } else {
          sanitizedData[field] = sanitizedUrl
        }
        break
        
      case 'phone':
        const sanitizedPhone = sanitizePhone(String(value))
        
        if (!sanitizedPhone) {
          errors.push(`Field '${field}' must be a valid phone number`)
        } else {
          sanitizedData[field] = sanitizedPhone
        }
        break
        
      case 'json':
        const sanitizedJson = sanitizeJson(String(value))
        
        if (sanitizedJson === null) {
          errors.push(`Field '${field}' must be valid JSON`)
        } else {
          sanitizedData[field] = sanitizedJson
        }
        break
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  }
}