"use client"

import { useEffect, useState } from 'react'
import { isTestUser } from '@/lib/test-user'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export function TestUserBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    setShowBanner(isTestUser())
  }, [])

  if (!showBanner) return null

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Demo Mode:</strong> You're logged in as the demo user. All data shown is mock data for demonstration purposes.
        Other users will see real API data.
      </AlertDescription>
    </Alert>
  )
}