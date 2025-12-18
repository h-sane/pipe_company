import { NextRequest } from 'next/server'

export function getSession(req: NextRequest) {
  const sessionCookie = req.cookies.get('session')
  
  if (sessionCookie?.value === 'admin') {
    return {
      user: {
        id: '1',
        email: 'admin@pipe.com',
        name: 'Admin User',
        role: 'ADMIN'
      }
    }
  }
  
  return null
}

export function requireAuth(req: NextRequest) {
  const session = getSession(req)
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}