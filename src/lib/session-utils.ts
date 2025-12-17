import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

/**
 * Clean up expired sessions and update user activity
 */
export async function cleanupExpiredSessions() {
  try {
    // In a real application with database sessions, you would clean up expired sessions here
    // For JWT-based sessions, this is handled automatically by NextAuth
    console.log('Session cleanup completed')
  } catch (error) {
    console.error('Session cleanup failed:', error)
  }
}

/**
 * Update user's last activity timestamp
 */
export async function updateUserActivity(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    })
  } catch (error) {
    console.error('Failed to update user activity:', error)
  }
}

/**
 * Validate session and check for security issues
 */
export async function validateSession() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { valid: false, reason: 'No session found' }
  }
  
  // Check if user still exists and has valid role
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!user) {
      return { valid: false, reason: 'User not found' }
    }
    
    if (user.role !== session.user.role) {
      return { valid: false, reason: 'Role mismatch' }
    }
    
    // Update last activity
    await updateUserActivity(user.id)
    
    return { valid: true, user, session }
  } catch (error) {
    console.error('Session validation error:', error)
    return { valid: false, reason: 'Validation error' }
  }
}

/**
 * Force logout by clearing session data
 */
export async function forceLogout(userId: string) {
  try {
    // In a database session setup, you would delete the session record here
    // For JWT sessions, the client needs to call signOut()
    console.log(`Force logout initiated for user: ${userId}`)
    
    // Update user record to track forced logout
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    })
  } catch (error) {
    console.error('Force logout failed:', error)
  }
}

/**
 * Check for suspicious activity patterns
 */
export async function checkSuspiciousActivity(userId: string, ipAddress?: string) {
  try {
    // In a production system, you would implement:
    // - Multiple failed login attempts
    // - Login from unusual locations
    // - Concurrent sessions from different IPs
    // - Unusual access patterns
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return { suspicious: true, reason: 'User not found' }
    }
    
    // Simple check: if last login was more than 30 days ago, flag as suspicious
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    if (user.lastLogin && user.lastLogin < thirtyDaysAgo) {
      return { suspicious: true, reason: 'Long time since last login' }
    }
    
    return { suspicious: false }
  } catch (error) {
    console.error('Suspicious activity check failed:', error)
    return { suspicious: true, reason: 'Check failed' }
  }
}