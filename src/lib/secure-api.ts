import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole, Permission } from '@prisma/client'
import { validateApiInput, ValidationResult } from './input-sanitization'
import { checkRateLimit, RateLimitConfig } from './access-control'

// API handler configuration
export interface SecureApiConfig {
  requireAuth?: boolean
  requiredRoles?: UserRole[]
  requiredPermissions?: Permission[]
  rateLimit?: RateLimitConfig
  validation?: Record<string, any>
  allowedMethods?: string[]
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Create a secure API response
export function createApiResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: status >= 200 && status < 300,
    data,
    message
  }
  
  return NextResponse.json(response, { status })
}

// Create an error API response
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { details })
  }
  
  return NextResponse.json(response, { status })
}

// Secure API handler wrapper
export function createSecureApiHandler(
  config: SecureApiConfig,
  handlers: Record<string, (req: NextRequest, context?: any) => Promise<NextResponse>>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Check allowed methods
      if (config.allowedMethods && !config.allowedMethods.includes(req.method)) {
        return createErrorResponse(
          `Method ${req.method} not allowed`,
          405
        )
      }
      
      // Rate limiting
      if (config.rateLimit) {
        const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
        const rateLimit = checkRateLimit(clientIp, config.rateLimit)
        
        if (!rateLimit.allowed) {
          return new NextResponse(
            JSON.stringify({ error: 'Too many requests' }),
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
                'X-RateLimit-Limit': String(config.rateLimit.maxRequests),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(rateLimit.resetTime)
              }
            }
          )
        }
      }
      
      // Authentication check
      if (config.requireAuth) {
        const token = await getToken({ 
          req, 
          secret: process.env.NEXTAUTH_SECRET 
        })
        
        if (!token) {
          return createErrorResponse('Authentication required', 401)
        }
        
        // Role check
        if (config.requiredRoles) {
          const userRole = token.role as UserRole
          if (!config.requiredRoles.includes(userRole)) {
            return createErrorResponse(
              `Insufficient role. Required: ${config.requiredRoles.join(', ')}`,
              403
            )
          }
        }
        
        // Permission check
        if (config.requiredPermissions) {
          const userPermissions = (token.permissions as Permission[]) || []
          const hasPermission = config.requiredPermissions.some(permission =>
            userPermissions.includes(permission)
          )
          
          if (!hasPermission) {
            return createErrorResponse(
              `Insufficient permissions. Required: ${config.requiredPermissions.join(', ')}`,
              403
            )
          }
        }
      }
      
      // Input validation
      if (config.validation && (req.method === 'POST' || req.method === 'PUT')) {
        try {
          const body = await req.json()
          const validation = validateApiInput(body, config.validation)
          
          if (!validation.isValid) {
            return createErrorResponse(
              'Validation failed',
              400,
              { errors: validation.errors }
            )
          }
          
          // Replace request body with sanitized data
          const sanitizedRequest = new NextRequest(req.url, {
            method: req.method,
            headers: req.headers,
            body: JSON.stringify(validation.sanitizedData)
          })
          
          // Call the appropriate handler
          const handler = handlers[req.method]
          if (!handler) {
            return createErrorResponse(`Method ${req.method} not implemented`, 501)
          }
          
          return await handler(sanitizedRequest, context)
        } catch (error) {
          return createErrorResponse('Invalid JSON in request body', 400)
        }
      }
      
      // Call the appropriate handler
      const handler = handlers[req.method]
      if (!handler) {
        return createErrorResponse(`Method ${req.method} not implemented`, 501)
      }
      
      return await handler(req, context)
      
    } catch (error) {
      console.error('API handler error:', error)
      
      return createErrorResponse(
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? { 
          stack: error instanceof Error ? error.stack : String(error) 
        } : undefined
      )
    }
  }
}

// Utility to extract and validate request data
export async function getValidatedRequestData<T>(
  req: NextRequest,
  schema: Record<string, any>
): Promise<{ data: T; validation: ValidationResult }> {
  const body = await req.json()
  const validation = validateApiInput(body, schema)
  
  return {
    data: validation.sanitizedData as T,
    validation
  }
}

// Utility to log security events
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' = 'medium'
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
    environment: process.env.NODE_ENV
  }
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    console.warn('SECURITY EVENT:', JSON.stringify(logEntry))
    // TODO: Send to external security monitoring service
  } else {
    console.log('Security Event:', logEntry)
  }
}

// Utility to check if request is from trusted source
export function isTrustedRequest(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const userAgent = req.headers.get('user-agent')
  
  // Check for suspicious patterns
  if (!userAgent || userAgent.length < 10) {
    return false
  }
  
  // In production, add more sophisticated checks
  if (process.env.NODE_ENV === 'production') {
    const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(',') || []
    
    if (origin && !trustedOrigins.includes(origin)) {
      return false
    }
  }
  
  return true
}

// Utility to sanitize database query parameters
export function sanitizeQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {}
  
  for (const [key, value] of searchParams.entries()) {
    // Only allow alphanumeric keys
    if (/^[a-zA-Z0-9_]+$/.test(key)) {
      // Sanitize the value
      const sanitizedValue = value.replace(/[<>'";&|`$(){}[\]\\]/g, '').trim()
      if (sanitizedValue.length > 0 && sanitizedValue.length <= 200) {
        sanitized[key] = sanitizedValue
      }
    }
  }
  
  return sanitized
}