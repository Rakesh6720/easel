import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  company?: string
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string
  azureCredentials: AzureCredential[]
}

export interface AzureCredential {
  id: number
  subscriptionName: string
  displayName: string
  isDefault: boolean
  lastValidated: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  company?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ValidationResponse {
  isValid: boolean
  errors: string[]
}

class AuthService {
  private token: string | null = null

  constructor() {
    // Initialize token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
      this.setupAxiosInterceptors()
    }
  }

  private setupAxiosInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
              withCredentials: true
            })
            
            const newToken = response.data.token
            this.setToken(newToken)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            
            return axios(originalRequest)
          } catch (refreshError) {
            this.logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  private removeToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_email')
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data, {
      withCredentials: true
    })
    
    const authData = response.data
    this.setToken(authData.token)
    
    return authData
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data, {
      withCredentials: true
    })
    
    const authData = response.data
    this.setToken(authData.token)
    
    // Store user email for test user detection
    if (authData.user?.email) {
      localStorage.setItem('user_email', authData.user.email)
    }
    
    return authData
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.removeToken()
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/auth/me`)
    return response.data
  }

  async validateEmail(email: string): Promise<ValidationResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/validate-email`, { email })
    return response.data
  }

  async validatePassword(password: string): Promise<ValidationResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/validate-password`, { password })
    return response.data
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      withCredentials: true
    })
    
    const authData = response.data
    this.setToken(authData.token)
    
    return authData
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }
}

export const authService = new AuthService()