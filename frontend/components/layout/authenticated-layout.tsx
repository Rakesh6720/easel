"use client"

import { useEffect, useState } from 'react'
import { isTestUser, TEST_USER_EMAIL } from '@/lib/test-user'
import { Info } from 'lucide-react'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

function GlobalTestUserBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkTestUser = () => {
      try {
        const userEmail = localStorage.getItem('user_email')
        const authToken = localStorage.getItem('auth_token')
        
        // Check by email first (most reliable)
        if (userEmail === TEST_USER_EMAIL) {
          setShowBanner(true)
          setIsLoading(false)
          return
        }
        
        // Check by token parsing if we have a token but no email stored
        if (authToken && !userEmail) {
          const testUserResult = isTestUser()
          setShowBanner(testUserResult)
        } else {
          setShowBanner(false)
        }
        
        setIsLoading(false)
      } catch (error) {
        console.warn('Error checking test user:', error)
        setShowBanner(false)
        setIsLoading(false)
      }
    }

    // Check immediately
    checkTestUser()
    
    // Check again after a short delay to ensure localStorage is ready
    const timeout = setTimeout(checkTestUser, 100)
    
    // Listen for storage changes (login/logout events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_email' || e.key === 'auth_token') {
        checkTestUser()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Don't render anything while loading
  if (isLoading) return null
  
  // Don't show banner if not test user
  if (!showBanner) return null

  return (
    <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium sticky top-0 z-50 border-b border-blue-700">
      <div className="flex items-center justify-center space-x-2">
        <Info className="h-4 w-4 text-blue-100 flex-shrink-0" />
        <span>
          🎭 <strong>DEMO MODE:</strong> Logged in as demo user ({TEST_USER_EMAIL}) - All data is mock data for demonstration
        </span>
      </div>
    </div>
  )
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <>
      <GlobalTestUserBanner />
      {children}
    </>
  )
}