"use client"

import { useEffect, useState } from 'react'
import { isTestUser, TEST_USER_EMAIL } from '@/lib/test-user'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export function TestUserBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check multiple times to ensure localStorage is available
    const checkTestUser = () => {
      try {
        const userEmail = localStorage.getItem('user_email')
        const authToken = localStorage.getItem('auth_token')
        
        console.log('TestUserBanner - userEmail:', userEmail) // Debug log
        console.log('TestUserBanner - isTestUser():', isTestUser()) // Debug log
        
        // Check by email first
        if (userEmail === TEST_USER_EMAIL) {
          setShowBanner(true)
          setIsLoading(false)
          return
        }
        
        // Check by token parsing
        if (authToken) {
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
    
    return () => clearTimeout(timeout)
  }, [])

  // Don't render anything while loading
  if (isLoading) return null
  
  // Show banner if test user detected
  if (!showBanner) return null

  return (
    <div className="mb-6">
      {/* Fallback banner that's always visible for now */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-lg border-2 border-blue-700">
        <div className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-blue-100" />
          <div className="font-semibold">
            🎭 <strong>DEMO MODE:</strong> You're logged in as the demo user ({TEST_USER_EMAIL}). 
            All data shown is mock data for demonstration purposes. Other users will see real API data.
          </div>
        </div>
      </div>
    </div>
  )
}