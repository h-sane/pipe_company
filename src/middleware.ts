import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { isAuthorized, checkRateLimit } from './lib/access-control'

export default withAuth(
  async function middleware(req) {
    const response = NextResponse.next()
    
    // Add comprehensive security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Enhanced CSP header
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', cspHeader)
    
    // Rate limiting for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // FIX: Replaced req.ip with header check to satisfy TypeScript and Next.js 15 compatibility
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
      const rateLimit = checkRateLimit(clientIp, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100 // 100 requests per 15 minutes
      })
      
      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({ error: 'Too many requests' }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
            }
          }
        )
      }
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', '100')
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
      response.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime))
    }
    
    // Enhanced access control for protected routes
    const path = req.nextUrl.pathname
    const method = req.method
    
    // Check authorization for protected routes
    if (path.startsWith('/admin') || path.startsWith('/api/')) {
      const authResult = await isAuthorized(req, path, method)
      
      if (!authResult.authorized) {
        if (path.startsWith('/admin')) {
          return NextResponse.redirect(
            new URL('/auth/signin?callbackUrl=' + encodeURIComponent(path), req.url)
          )
        } else {
          return new Response(
            JSON.stringify({ 
              error: 'Access denied',
              reason: authResult.reason 
            }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }
    }
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (!req.nextUrl.pathname.startsWith('/admin')) {
          return true
        }
        
        // Require authentication for admin routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
}