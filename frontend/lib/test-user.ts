// Test user configuration and utilities
// This allows us to have a demo user with rich mock data while others use real API

export const TEST_USER_EMAIL = 'demo@easel.com'
export const TEST_USER_ID = 999999 // Use a high ID that won't conflict

// Check if current user is the test user
export function isTestUser(): boolean {
  try {
    // Check by email from localStorage (set during login)
    const userEmail = localStorage.getItem('user_email')
    if (userEmail === TEST_USER_EMAIL) {
      return true
    }

    // Fallback: check by parsing JWT token
    const token = localStorage.getItem('auth_token')
    if (!token) return false

    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.email === TEST_USER_EMAIL || payload.userId === TEST_USER_ID
  } catch (error) {
    console.warn('Error checking test user status:', error)
    return false
  }
}

// Get current user info for conditional logic
export function getCurrentUserInfo() {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return null

    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      userId: payload.userId,
      email: payload.email,
      isTestUser: payload.email === TEST_USER_EMAIL || payload.userId === TEST_USER_ID
    }
  } catch (error) {
    return null
  }
}

// Mock user data for the test user
export const TEST_USER_DATA = {
  id: TEST_USER_ID,
  email: TEST_USER_EMAIL,
  firstName: 'Demo',
  lastName: 'User',
  company: 'Easel Demo',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: new Date().toISOString(),
  azureCredentials: [
    {
      id: 1,
      subscriptionName: 'Demo Production Subscription',
      displayName: 'Production Environment',
      isDefault: true,
      lastValidated: new Date().toISOString()
    },
    {
      id: 2,
      subscriptionName: 'Demo Development Subscription', 
      displayName: 'Development Environment',
      isDefault: false,
      lastValidated: new Date().toISOString()
    }
  ]
}