import { NextRequest } from 'next/server'
import { getSession } from './auth-helper'
import { UserRole, Permission } from '@prisma/client'

/**
 * Get current session for MVP
 */
export function getCurrentSession(req: NextRequest) {
  return getSession(req)
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  if (requiredRole === UserRole.ADMIN) {
    return userRole === 'ADMIN'
  }
  if (requiredRole === UserRole.CONTENT_MANAGER) {
    return userRole === 'ADMIN' || userRole === 'CONTENT_MANAGER'
  }
  return true
}

/**
 * Check if user has required permission (MVP - simplified)
 */
export function hasPermission(userRole: string, requiredPermission: Permission): boolean {
  // For MVP, admin has all permissions
  return userRole === 'ADMIN'
}

/**
 * Middleware to check authentication and authorization
 */
export function requireAuth(req: NextRequest, requiredRole?: UserRole, requiredPermission?: Permission) {
  const session = getCurrentSession(req)
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  if (requiredRole && !hasRole(session.user.role, requiredRole)) {
    throw new Error('Insufficient role permissions')
  }
  
  if (requiredPermission && !hasPermission(session.user.role, requiredPermission)) {
    throw new Error('Insufficient permissions')
  }
  
  return session
}

/**
 * API route wrapper for authentication
 */
export function withAuth(
  handler: (req: NextRequest, session: any) => Promise<Response>,
  requiredRole?: UserRole,
  requiredPermission?: Permission
) {
  return async (req: NextRequest) => {
    try {
      const session = await requireAuth(req, requiredRole, requiredPermission)
      return await handler(req, session)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        if (error.message.includes('permissions')) {
          return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}