"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { authService } from "@/lib/auth"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface ValidationState {
  email: {
    isValid: boolean
    errors: string[]
    checked: boolean
  }
  password: {
    isValid: boolean
    errors: string[]
    checked: boolean
  }
}

export function RegisterForm() {
  const router = useRouter()
  const { register, loading } = useAuth()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [validation, setValidation] = useState<ValidationState>({
    email: { isValid: false, errors: [], checked: false },
    password: { isValid: false, errors: [], checked: false }
  })

  // Real-time email validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (formData.email && formData.email.length > 0) {
        try {
          const result = await authService.validateEmail(formData.email)
          setValidation(prev => ({
            ...prev,
            email: {
              isValid: result.isValid,
              errors: result.errors,
              checked: true
            }
          }))
        } catch (error) {
          console.error('Email validation error:', error)
        }
      } else {
        setValidation(prev => ({
          ...prev,
          email: { isValid: false, errors: [], checked: false }
        }))
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.email])

  // Real-time password validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (formData.password && formData.password.length > 0) {
        try {
          const result = await authService.validatePassword(formData.password)
          setValidation(prev => ({
            ...prev,
            password: {
              isValid: result.isValid,
              errors: result.errors,
              checked: true
            }
          }))
        } catch (error) {
          console.error('Password validation error:', error)
        }
      } else {
        setValidation(prev => ({
          ...prev,
          password: { isValid: false, errors: [], checked: false }
        }))
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.password])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }

    if (!validation.email.isValid) {
      newErrors.email = validation.email.errors[0] || 'Please enter a valid email address'
    }

    if (!validation.password.isValid) {
      newErrors.password = validation.password.errors[0] || 'Password does not meet requirements'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.company && !/^[a-zA-Z0-9\s\-&.,()]+$/.test(formData.company)) {
      newErrors.company = 'Company name contains invalid characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!validateForm()) {
      return
    }

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        company: formData.company.trim() || undefined
      })
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Registration error:', error)
      
      if (error.response?.data?.message) {
        setSubmitError(error.response.data.message)
      } else if (error.response?.data?.errors) {
        setSubmitError(error.response.data.errors.join(', '))
      } else {
        setSubmitError('Registration failed. Please try again.')
      }
    }
  }

  const getFieldIcon = (field: 'email' | 'password') => {
    const fieldValidation = validation[field]
    if (!fieldValidation.checked) return null
    
    return fieldValidation.isValid ? (
      <CheckCircle className="h-4 w-4 text-azure-green" />
    ) : (
      <AlertCircle className="h-4 w-4 text-destructive" />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-azure-gray-50 to-blue-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 azure-gradient rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>
            Join Easel to start managing your Azure resources with AI
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={errors.firstName ? 'border-destructive' : ''}
                  disabled={loading}
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={errors.lastName ? 'border-destructive' : ''}
                  disabled={loading}
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={loading}
                  autoComplete="email"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getFieldIcon('email')}
                </div>
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
              {validation.email.checked && !validation.email.isValid && (
                <div className="text-sm text-destructive space-y-1">
                  {validation.email.errors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                name="company"
                placeholder="Acme Inc."
                value={formData.company}
                onChange={handleInputChange}
                className={errors.company ? 'border-destructive' : ''}
                disabled={loading}
                autoComplete="organization"
              />
              {errors.company && (
                <p className="text-sm text-destructive">{errors.company}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'border-destructive pr-16' : 'pr-16'}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {getFieldIcon('password')}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {validation.password.checked && !validation.password.isValid && (
                <div className="text-sm text-destructive space-y-1">
                  {validation.password.errors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="azure"
              disabled={loading || !validation.email.isValid || !validation.password.isValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link 
                href="/login" 
                className="text-azure-blue hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}