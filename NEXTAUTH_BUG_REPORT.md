# NextAuth ENOENT Bug Report - External AI Assistance Required

## Problem Summary
A Next.js 15 application with NextAuth.js is failing to build due to a persistent ENOENT error when trying to access `default-stylesheet.css`. The error occurs during the "Collecting page data" phase of the build process.

## Error Details
```
Error: ENOENT: no such file or directory, open 'C:\Users\husai\Desktop\CODES\Freelance\pipe\.next\browser\default-stylesheet.css'
```

**Error Location:** During `npm run build` at the page data collection phase
**Build Status:** Compilation succeeds, but build fails when collecting page data
**Specific Failure Point:** `/api/documents/organize` endpoint

## Environment Information
- **OS:** Windows 11
- **Node.js:** Latest stable
- **Next.js:** 15.1.0 (upgraded from 14)
- **NextAuth.js:** 4.24.11 (upgraded from 4.24.10)
- **React:** 19.0.0
- **TypeScript:** 5.7.2

## Project Structure
This is a comprehensive e-commerce website for a pipe supply business with:
- Full-stack Next.js application
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- Admin interface for content management
- Product catalog and quote system

## Attempted Solutions

### 1. Version Update (FAILED)
- Updated next-auth from 4.24.10 to 4.24.11 (supposed to fix Next.js 15 compatibility)
- Result: Error persists

### 2. Configuration Changes (FAILED)
Updated `src/lib/auth.ts` with explicit page and theme configuration:
```typescript
export const authOptions: NextAuthOptions = {
  // ... providers and callbacks ...
  
  // VITAL: This prevents NextAuth from trying to render default pages
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/signin',
    newUser: '/auth/signin'
  },
  
  // VITAL: This prevents NextAuth from loading default CSS
  theme: {
    colorScheme: 'light',
    brandColor: '#000000',
    logo: '',
    buttonText: ''
  },
  // ...
}
```

### 3. API Route Cleanup (FAILED)
Simplified `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 4. Build Cache Clear (FAILED)
- Removed `.next` directory
- Reinstalled dependencies
- Result: Same error persists

## Current Authentication Setup

### Auth Configuration (`src/lib/auth.ts`)
- Uses CredentialsProvider for email/password authentication
- Implements role-based access (ADMIN, CONTENT_MANAGER)
- JWT strategy with 8-hour sessions
- Prisma integration for user lookup
- Password verification with bcrypt
- Build-time skip logic: `if (process.env.NEXT_PHASE === 'phase-production-build')`

### Custom Auth Pages
- `/auth/signin` - Custom sign-in page
- `/auth/error` - Custom error page
- All NextAuth default pages redirected to custom pages

### API Routes Using Auth
The application has extensive API routes that may be triggering NextAuth during build:
- `/api/products/*` - Product management
- `/api/quotes/*` - Quote system
- `/api/media/*` - Media management
- `/api/documents/*` - Document management (where error occurs)
- `/api/auth/*` - Authentication endpoints

## Key Observations

1. **Build vs Runtime:** Error only occurs during build, not during development
2. **Specific Endpoint:** Error consistently occurs at `/api/documents/organize`
3. **File Path:** NextAuth is looking for `default-stylesheet.css` in `.next/browser/` directory
4. **Next.js 15 Compatibility:** This appears to be a Next.js 15 + NextAuth compatibility issue

## Questions for External AI

1. **Root Cause:** Is this a known Next.js 15 + NextAuth compatibility issue beyond version 4.24.11?

2. **Build-Time Auth:** Should NextAuth be completely disabled during build? Current skip logic may be insufficient.

3. **API Route Analysis:** Could the `/api/documents/organize` endpoint be inadvertently triggering NextAuth during static generation?

4. **Alternative Solutions:** 
   - Should we implement a different authentication strategy?
   - Is there a way to prevent NextAuth from loading any default assets?
   - Could this be related to static generation of API routes?

5. **Configuration Missing:** Are there additional Next.js 15 specific configurations needed for NextAuth?

## Files Requiring Analysis

### Critical Files
- `src/lib/auth.ts` - Main NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/app/api/documents/organize/route.ts` - Where error occurs
- `next.config.js` - Next.js configuration
- `package.json` - Dependencies

### Supporting Files
- `src/middleware.ts` - Route protection middleware
- `src/lib/session-utils.ts` - Session management utilities
- `src/types/next-auth.d.ts` - NextAuth type definitions

## Expected Outcome
The application should build successfully without ENOENT errors, allowing deployment to production while maintaining full authentication functionality.

## Urgency
HIGH - This is blocking production deployment of a completed application.

## Configuration Files Analysis

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  compress: true,
  reactStrictMode: true,
  // ... headers configuration
}
```

### Failing API Route (`/api/documents/organize`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication - THIS IS WHERE THE ERROR OCCURS
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ... rest of the function
  } catch (error) {
    console.error('Document organization error:', error);
    return NextResponse.json(
      { error: 'Failed to organize documents' },
      { status: 500 }
    );
  }
}
```

### Middleware Configuration
```typescript
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  async function middleware(req) {
    // Comprehensive security headers and rate limiting
    // ... middleware logic
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!req.nextUrl.pathname.startsWith('/admin')) {
          return true
        }
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
```

## Critical Analysis Points

### 1. Build-Time Session Check
The error occurs when `getServerSession(authOptions)` is called during build time in the `/api/documents/organize` route. This suggests NextAuth is trying to initialize during static generation.

### 2. Middleware Interaction
The middleware uses `withAuth` from NextAuth, which might be contributing to the issue during build-time route analysis.

### 3. Dynamic Route Declaration
The route has `export const dynamic = 'force-dynamic'` but the error still occurs during page data collection.

### 4. Session Import Pattern
Using `getServerSession` with `authOptions` import might be triggering NextAuth initialization at build time.

## Potential Root Causes

1. **Static Generation Conflict:** Next.js 15 might be trying to statically analyze API routes that use NextAuth
2. **Middleware Processing:** The middleware matcher might be causing NextAuth to initialize during build
3. **Session Check in API Routes:** `getServerSession` calls during build-time route discovery
4. **NextAuth Asset Loading:** Despite configuration, NextAuth is still trying to load default assets

## Immediate Questions for External AI

1. Should API routes with authentication be excluded from static generation entirely?
2. Is there a Next.js 15 specific way to prevent NextAuth initialization during build?
3. Could the middleware configuration be causing this issue?
4. Should we implement a different pattern for API route authentication in Next.js 15?

## Current Status
- Application works perfectly in development mode
- Build fails consistently at the same point
- All attempted fixes have failed
- Production deployment is blocked