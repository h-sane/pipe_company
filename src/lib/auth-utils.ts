import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole, Permission } from '@prisma/client'
import { NextRequest } from 'next/server'

/**
 * Get the current session on the server side
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.CONTENT_MANAGER]: 1,
    [UserRole.ADMIN]: 2
  }
  
  return roleHierarchy[userRole as UserRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if user has required permission
 */
export function hasPermission(userPermissions: Permission[] | undefined, requiredPermission: Permission): boolean {
  if (!userPermissions) return false
  return userPermissions.includes(requiredPermission)
}

/**
 * Middleware to check authentication and authorization
 */
export async function requireAuth(requiredRole?: UserRole, requiredPermission?: Permission) {
  const session = await getCurrentSession()
  
  if (!session || !session.user) {
    throw new Error('Unauthorized: No valid session')
  }
  
  if (requiredRole && !hasRole(session.user.role, requiredRole)) {
    throw new Error(`Unauthorized: Requires ${requiredRole} role`)
  }
  
  if (requiredPermission && !hasPermission(session.user.permissions, requiredPermission)) {
    throw new Error(`Unauthorized: Requires ${requiredPermission} permission`)
  }
  
  return session
}

/**
 * Check if user is admin
 */
export function isAdmin(session: any): boolean {
  return hasRole(session?.user?.role, UserRole.ADMIN)
}

/**
 * Check if user is content manager or admin
 */
export function isContentManager(session: any): boolean {
  return hasRole(session?.user?.role, UserRole.CONTENT_MANAGER)
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
      const session = await requireAuth(requiredRole, requiredPermission)
      return await handler(req, session)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}