// Define enum values directly from schema
const QuoteStatus = {
  PENDING: 'PENDING',
  RESPONDED: 'RESPONDED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
} as const

type QuoteStatus = typeof QuoteStatus[keyof typeof QuoteStatus]

export interface QuoteRequestData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  message?: string
  products: QuoteProductData[]
}

export interface QuoteProductData {
  productId: string
  quantity: number
  notes?: string
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export function validateQuoteRequest(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // Validate required fields
  if (!data.customerName || typeof data.customerName !== 'string' || data.customerName.trim().length === 0) {
    errors.push({ field: 'customerName', message: 'Customer name is required' })
  }

  if (!data.customerEmail || typeof data.customerEmail !== 'string') {
    errors.push({ field: 'customerEmail', message: 'Customer email is required' })
  } else if (!isValidEmail(data.customerEmail)) {
    errors.push({ field: 'customerEmail', message: 'Invalid email format' })
  }

  // Validate optional fields
  if (data.customerPhone && typeof data.customerPhone !== 'string') {
    errors.push({ field: 'customerPhone', message: 'Customer phone must be a string' })
  }

  if (data.company && typeof data.company !== 'string') {
    errors.push({ field: 'company', message: 'Company must be a string' })
  }

  if (data.address && typeof data.address !== 'string') {
    errors.push({ field: 'address', message: 'Address must be a string' })
  }

  if (data.city && typeof data.city !== 'string') {
    errors.push({ field: 'city', message: 'City must be a string' })
  }

  if (data.state && typeof data.state !== 'string') {
    errors.push({ field: 'state', message: 'State must be a string' })
  }

  if (data.zipCode && typeof data.zipCode !== 'string') {
    errors.push({ field: 'zipCode', message: 'Zip code must be a string' })
  }

  if (data.country && typeof data.country !== 'string') {
    errors.push({ field: 'country', message: 'Country must be a string' })
  }

  if (data.message && typeof data.message !== 'string') {
    errors.push({ field: 'message', message: 'Message must be a string' })
  }

  // Validate products array
  if (!data.products || !Array.isArray(data.products)) {
    errors.push({ field: 'products', message: 'Products array is required' })
  } else if (data.products.length === 0) {
    errors.push({ field: 'products', message: 'At least one product is required' })
  } else {
    data.products.forEach((product: any, index: number) => {
      if (!product.productId || typeof product.productId !== 'string') {
        errors.push({ field: `products[${index}].productId`, message: 'Product ID is required' })
      }

      if (!product.quantity || typeof product.quantity !== 'number' || product.quantity <= 0) {
        errors.push({ field: `products[${index}].quantity`, message: 'Quantity must be a positive number' })
      }

      if (product.notes && typeof product.notes !== 'string') {
        errors.push({ field: `products[${index}].notes`, message: 'Notes must be a string' })
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeQuoteRequest(data: any): QuoteRequestData {
  return {
    customerName: sanitizeString(data.customerName),
    customerEmail: sanitizeString(data.customerEmail),
    customerPhone: data.customerPhone ? sanitizeString(data.customerPhone) : undefined,
    company: data.company ? sanitizeString(data.company) : undefined,
    address: data.address ? sanitizeString(data.address) : undefined,
    city: data.city ? sanitizeString(data.city) : undefined,
    state: data.state ? sanitizeString(data.state) : undefined,
    zipCode: data.zipCode ? sanitizeString(data.zipCode) : undefined,
    country: data.country ? sanitizeString(data.country) : undefined,
    message: data.message ? sanitizeString(data.message) : undefined,
    products: Array.isArray(data.products) ? data.products.map((product: any) => ({
      productId: sanitizeString(product.productId),
      quantity: parseInt(product.quantity),
      notes: product.notes ? sanitizeString(product.notes) : undefined
    })) : []
  }
}

export function validateQuoteStatus(status: string): boolean {
  return Object.values(QuoteStatus).includes(status as QuoteStatus)
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field}: ${error.message}`).join(', ')
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function sanitizeString(value: any): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/[<>]/g, '') // Basic XSS prevention
}

export function createQuoteAuditEntry(
  quoteId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  userId: string,
  oldData: any,
  newData: any,
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  return {
    quoteId,
    action,
    userId,
    oldData,
    newData,
    metadata,
    timestamp: new Date().toISOString()
  }
}