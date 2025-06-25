"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from '@/lib/auth'
import { TEST_USER_EMAIL } from '@/lib/test-user'

export default function TestDemoUserPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createDemoUser = async () => {
    setIsCreating(true)
    setError(null)
    setResult(null)
    
    try {
      const registerResult = await authService.register({
        email: TEST_USER_EMAIL,
        password: 'DemoPassword123@',
        firstName: 'Demo',
        lastName: 'User',
        company: 'Easel Demo'
      })
      
      setResult(`Demo user created and logged in successfully! User ID: ${registerResult.user.id}`)
    } catch (err: any) {
      if (err.response?.data?.message?.includes('already exists')) {
        // User already exists, try to login
        try {
          const loginResult = await authService.login({
            email: TEST_USER_EMAIL,
            password: 'DemoPassword123@'
          })
          setResult(`Demo user already exists. Logged in successfully! User ID: ${loginResult.user.id}`)
        } catch (loginErr: any) {
          setError(`Demo user exists but login failed: ${loginErr.response?.data?.message || loginErr.message}`)
        }
      } else {
        setError(`Failed to create demo user: ${err.response?.data?.message || err.message}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const loginAsDemoUser = async () => {
    setIsCreating(true)
    setError(null)
    setResult(null)
    
    try {
      const loginResult = await authService.login({
        email: TEST_USER_EMAIL,
        password: 'DemoPassword123@'
      })
      setResult(`Logged in as demo user successfully! User ID: ${loginResult.user.id}`)
    } catch (err: any) {
      setError(`Failed to login as demo user: ${err.response?.data?.message || err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Demo User Test Page</CardTitle>
          <CardDescription>
            Create and test the demo user functionality with mock data
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Demo User Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Demo User Details</h3>
            <div className="space-y-1 text-sm">
              <div><strong>Email:</strong> {TEST_USER_EMAIL}</div>
              <div><strong>Password:</strong> DemoPassword123@</div>
              <div><strong>Name:</strong> Demo User</div>
              <div><strong>Company:</strong> Easel Demo</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button 
              onClick={createDemoUser} 
              disabled={isCreating} 
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create Demo User (or Login if Exists)'}
            </Button>
            
            <Button 
              onClick={loginAsDemoUser} 
              disabled={isCreating} 
              variant="outline"
              className="w-full"
            >
              {isCreating ? 'Logging in...' : 'Login as Demo User'}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {result}
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What happens when you login as demo user:</h3>
            <ul className="space-y-1 text-sm">
              <li>• Projects page shows 5 rich mock projects</li>
              <li>• Azure credentials shows 3 mock subscriptions</li>
              <li>• All API calls use mock data with simulated delays</li>
              <li>• Blue demo banner appears on all pages</li>
              <li>• No real Azure resources are created</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}