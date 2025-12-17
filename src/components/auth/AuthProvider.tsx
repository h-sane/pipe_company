'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import SessionMonitor from './SessionMonitor'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <SessionMonitor>
        {children}
      </SessionMonitor>
    </SessionProvider>
  )
}