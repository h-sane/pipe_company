import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole, Permission } from '@prisma/client'

// Define access control rules
export interface AccessRule {
  path: string
  methods: string[]
  roles: UserRole[]
  permissions?: Permission[]
  requireAll?: boolean // If true, user must have ALL permissions, otherwise ANY
}

// Access control configuration
export const ACCESS_RULES: AccessRule[] = [
  // Product management
  {
    path: '/api/products',
    methods: ['POST', 'PUT', 'DELETE'],
    roles: [UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    permissions: [Permission.MANAGE_PRODUCTS]
  },
  
  // Quote management
  {
    path: '/api/quotes',
    methods: ['GET', 'PUT', 'DELETE'],
    roles: [UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    permissions: [Permission.MANAGE_QUOTES]
  },
  
  // Media management
  {
    path: '/api/media',
    methods: ['POST', 'PUT', 'DELETE'],
    roles: [UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    permissions: [Permission.MANAGE_MEDIA]
  },
  
  // User management (admin only)
  {
    path: '/api/users',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    roles: [UserRole.ADMIN],
    permissions: [Permission.MANAGE_USERS]
  },
  
  // Analytics (admin and content managers with permission)
  {
    path: '/api/analytics',
    methods: ['GET'],
    roles: [UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    permissions: [Permission.VIEW_ANALYTICS]
  },
  
  // Admin dashboard
  {
    path: '/admin',
    methods: ['GET'],
    roles: [UserRole.ADMIN, UserRole.CONTENT_MANAGER]
  }
]

// Check if user has required role
export function hasRequiredRole(userRole: string, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole)
}

// Check if user has required permissions
export function hasRequiredPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[],
  requireAll: boolean = false
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }
  
  if (requireAll) {
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
  } else {
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    )
  }
}

// Find matching access rule for a request
export function findAccessRule(path: string, method: string): AccessRule | null {
  return ACCESS_RULES.find(rule => {
    const pathMatches = path.startsWith(rule.path)
    const methodMatches = rule.methods.includes(method)
    return pathMatches && methodMatches
  }) || null
}

// Check if user is authorized for a specific request
export async function isAuthorized(
  req: NextRequest,
  path: string,
  method: string
): Promise<{ authorized: boolean; reason?: string }> {
  try {
    // Get user token
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) {
      return { authorized: false, reason: 'No authentication token' }
    }
    
    // Find applicable access rule
    const rule = findAccessRule(path, method)
    
    if (!rule) {
      // No specific rule found, allow access for authenticated users
      return { authorized: true }
    }
    
    // Check role requirements
    if (!hasRequiredRole(token.role as string, rule.roles)) {
      return { 
        authorized: false, 
        reason: `Insufficient role. Required: ${rule.roles.join(', ')}, User has: ${token.role}` 
      }
    }
    
    // Check permission requirements
    if (rule.permissions) {
      const userPermissions = (token.permissions as Permission[]) || []
      
      if (!hasRequiredPermissions(userPermissions, rule.permissions, rule.requireAll)) {
        return { 
          authorized: false, 
          reason: `Insufficient permissions. Required: ${rule.permissions.join(', ')}, User has: ${userPermissions.join(', ')}` 
        }
      }
    }
    
    return { authorized: true }
  } catch (error) {
    console.error('Authorization check failed:', error)
    return { authorized: false, reason: 'Authorization check failed' }
  }
}

// Middleware helper for API routes
export function createAuthMiddleware(requiredRoles?: UserRole[], requiredPermissions?: Permission[]) {
  return async (req: NextRequest) => {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Check roles if specified
    if (requiredRoles && !hasRequiredRole(token.role as string, requiredRoles)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient role permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Check permissions if specified
    if (requiredPermissions) {
      const userPermissions = (token.permissions as Permission[]) || []
      
      if (!hasRequiredPermissions(userPermissions, requiredPermissions)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    
    return null // Authorization passed
  }
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
  
  const current = rateLimitStore.get(identifier)
  
  if (!current || current.resetTime < now) {
    // First request or window expired
    const resetTime = now + config.windowMs
    rateLimitStore.set(identifier, { count: 1, resetTime })
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime
    }
  }
  
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  // Increment count
  current.count++
  rateLimitStore.set(identifier, current)
  
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  }
}