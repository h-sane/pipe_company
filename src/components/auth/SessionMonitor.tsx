'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SessionMonitorProps {
  children: React.ReactNode
}

export default function SessionMonitor({ children }: SessionMonitorProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const checkSession = useCallback(async () => {
    if (status === 'authenticated' && session) {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include'
        })

        if (!response.ok) {
          console.warn('Session validation failed, signing out')
          await signOut({ redirect: false })
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }
  }, [session, status, router])

  const updateActivity = useCallback(async () => {
    if (status === 'authenticated' && session) {
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          credentials: 'include'
        })
      } catch (error) {
        console.error('Activity update failed:', error)
      }
    }
  }, [session, status])

  useEffect(() => {
    // Check session validity every 5 minutes
    const sessionCheckInterval = setInterval(checkSession, 5 * 60 * 1000)

    // Update activity every 2 minutes when user is active
    const activityUpdateInterval = setInterval(updateActivity, 2 * 60 * 1000)

    // Listen for user activity to update session
    const handleUserActivity = () => {
      updateActivity()
    }

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    let activityTimeout: NodeJS.Timeout

    const throttledActivity = () => {
      clearTimeout(activityTimeout)
      activityTimeout = setTimeout(handleUserActivity, 30000) // Throttle to once per 30 seconds
    }

    events.forEach(event => {
      document.addEventListener(event, throttledActivity, true)
    })

    return () => {
      clearInterval(sessionCheckInterval)
      clearInterval(activityUpdateInterval)
      clearTimeout(activityTimeout)
      events.forEach(event => {
        document.removeEventListener(event, throttledActivity, true)
      })
    }
  }, [checkSession, updateActivity])

  // Handle session expiration warning
  useEffect(() => {
    if (status === 'authenticated' && session?.expires) {
      const expiryTime = new Date(session.expires).getTime()
      const currentTime = Date.now()
      const timeUntilExpiry = expiryTime - currentTime

      // Show warning 10 minutes before expiry
      const warningTime = timeUntilExpiry - (10 * 60 * 1000)

      if (warningTime > 0) {
        const warningTimeout = setTimeout(() => {
          const shouldExtend = confirm(
            'Your session will expire in 10 minutes. Would you like to extend it?'
          )
          
          if (shouldExtend) {
            // Refresh the session by making a request
            updateActivity()
          }
        }, warningTime)

        return () => clearTimeout(warningTimeout)
      }
    }
  }, [session, status, updateActivity])

  return <>{children}</>
}