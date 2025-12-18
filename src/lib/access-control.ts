import { NextRequest } from 'next/server'
import { getSession } from './auth-helper'
import { UserRole, Permission } from '@prisma/client'

// Simple rate limiting for MVP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  clientId: string,
  options: { windowMs: number; maxRequests: number }
) {
  const now = Date.now()
  const windowStart = now - options.windowMs
  
  const current = rateLimitMap.get(clientId)
  
  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + options.windowMs })
    return { allowed: true, remaining: options.maxRequests - 1, resetTime: now + options.windowMs }
  }
  
  if (current.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  current.count++
  return { allowed: true, remaining: options.maxRequests - current.count, resetTime: current.resetTime }
}

export async function isAuthorized(
  req: NextRequest,
  path: string,
  method: string
): Promise<{ authorized: boolean; reason?: string }> {
  // Public routes
  if (path.startsWith('/api/products') && method === 'GET') {
    return { authorized: true }
  }
  
  if (path.startsWith('/api/quotes') && method === 'POST') {
    return { authorized: true }
  }
  
  if (path.startsWith('/api/company') && method === 'GET') {
    return { authorized: true }
  }
  
  // Admin routes require authentication
  if (path.startsWith('/admin') || path.startsWith('/api/')) {
    const session = getSession(req)
    if (!session) {
      return { authorized: false, reason: 'Authentication required' }
    }
    
    if (session.user.role !== 'ADMIN') {
      return { authorized: false, reason: 'Admin access required' }
    }
  }
  
  return { authorized: true }
}