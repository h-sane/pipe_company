'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function LogoutButton({ className, children }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      // Clear session on server
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Server session cleanup failed:', error)
    }
    
    // Sign out with NextAuth
    await signOut({
      callbackUrl: '/',
      redirect: true
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className || 'text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50'}
    >
      {isLoggingOut ? 'Signing out...' : (children || 'Sign out')}
    </button>
  )
}