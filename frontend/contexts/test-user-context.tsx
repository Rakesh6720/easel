"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { isTestUser, TEST_USER_EMAIL } from '@/lib/test-user'

interface TestUserContextType {
  isTestUser: boolean
  userEmail: string | null
  refreshTestUserStatus: () => void
}

const TestUserContext = createContext<TestUserContextType | undefined>(undefined)

export function TestUserProvider({ children }: { children: ReactNode }) {
  const [isTest, setIsTest] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const refreshTestUserStatus = () => {
    try {
      const email = localStorage.getItem('user_email')
      const testStatus = isTestUser()
      
      setUserEmail(email)
      setIsTest(testStatus)
      
      console.log('TestUserContext - refreshed:', { email, testStatus }) // Debug
    } catch (error) {
      console.warn('Error refreshing test user status:', error)
      setIsTest(false)
      setUserEmail(null)
    }
  }

  useEffect(() => {
    // Initial check
    refreshTestUserStatus()

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_email' || e.key === 'auth_token') {
        refreshTestUserStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <TestUserContext.Provider value={{ 
      isTestUser: isTest, 
      userEmail, 
      refreshTestUserStatus 
    }}>
      {children}
    </TestUserContext.Provider>
  )
}

export function useTestUser() {
  const context = useContext(TestUserContext)
  if (context === undefined) {
    throw new Error('useTestUser must be used within a TestUserProvider')
  }
  return context
}

// Global test user banner component
export function GlobalTestUserBanner() {
  const { isTestUser: isTest, userEmail } = useTestUser()

  if (!isTest) return null

  return (
    <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
      🎭 <strong>DEMO MODE:</strong> Logged in as demo user ({userEmail || TEST_USER_EMAIL}) - All data is mock data for demonstration
    </div>
  )
}