"use client"

import { useEffect, useState } from 'react'
import { isTestUser, getCurrentUserInfo, TEST_USER_EMAIL } from '@/lib/test-user'
import { Button } from '@/components/ui/button'

export function TestUserDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const checkTestUser = () => {
    const userInfo = getCurrentUserInfo()
    const testUser = isTestUser()
    const userEmail = localStorage.getItem('user_email')
    const authToken = localStorage.getItem('auth_token')
    
    setDebugInfo({
      isTestUser: testUser,
      userInfo,
      userEmail,
      hasAuthToken: !!authToken,
      testUserEmail: TEST_USER_EMAIL,
      localStorage: {
        user_email: localStorage.getItem('user_email'),
        auth_token: localStorage.getItem('auth_token')?.substring(0, 20) + '...'
      }
    })
  }

  useEffect(() => {
    checkTestUser()
  }, [])

  if (!debugInfo) return null

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg max-w-sm text-xs z-50">
      <h4 className="font-bold mb-2">Test User Debug</h4>
      <Button onClick={checkTestUser} size="sm" className="mb-2">Refresh</Button>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}