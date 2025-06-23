"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { azureService, AddAzureCredentialsRequest } from "@/lib/azure"
import { Plus, Loader2, AlertCircle, ExternalLink, Eye, EyeOff } from "lucide-react"

interface AddCredentialsDialogProps {
  onCredentialsAdded?: () => void
  children?: React.ReactNode
}

export function AddCredentialsDialog({ onCredentialsAdded, children }: AddCredentialsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showClientSecret, setShowClientSecret] = useState(false)
  
  const [formData, setFormData] = useState<AddAzureCredentialsRequest>({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    displayName: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.subscriptionId || !formData.tenantId || !formData.clientId || !formData.clientSecret || !formData.displayName) {
      setError('All fields are required')
      return false
    }

    // Validate GUID format for Azure IDs
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    
    if (!guidRegex.test(formData.subscriptionId)) {
      setError('Subscription ID must be a valid GUID')
      return false
    }
    
    if (!guidRegex.test(formData.tenantId)) {
      setError('Tenant ID must be a valid GUID')
      return false
    }
    
    if (!guidRegex.test(formData.clientId)) {
      setError('Client ID must be a valid GUID')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)
    try {
      await azureService.addCredentials(formData)
      
      // Reset form and close dialog
      setFormData({
        subscriptionId: '',
        tenantId: '',
        clientId: '',
        clientSecret: '',
        displayName: ''
      })
      setOpen(false)
      onCredentialsAdded?.()
    } catch (error: any) {
      console.error('Failed to add credentials:', error)
      if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else if (error.response?.data?.errors) {
        setError(error.response.data.errors.join(', '))
      } else {
        setError('Failed to add Azure credentials. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="azure">
            <Plus className="mr-2 h-4 w-4" />
            Add Azure Subscription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Azure Subscription</DialogTitle>
          <DialogDescription>
            Connect your Azure subscription to deploy and manage resources through Easel.
            You'll need to create a service principal in your Azure subscription.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="e.g., Work Account, Personal, Development"
                value={formData.displayName}
                onChange={handleInputChange}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this Azure subscription
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionId">Subscription ID</Label>
              <Input
                id="subscriptionId"
                name="subscriptionId"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.subscriptionId}
                onChange={handleInputChange}
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                name="tenantId"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.tenantId}
                onChange={handleInputChange}
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID (Application ID)</Label>
              <Input
                id="clientId"
                name="clientId"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.clientId}
                onChange={handleInputChange}
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  name="clientSecret"
                  type={showClientSecret ? "text" : "password"}
                  placeholder="Enter your service principal client secret"
                  value={formData.clientSecret}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                  disabled={loading}
                >
                  {showClientSecret ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Need help setting up a service principal?</strong>
              <br />
              <a 
                href="https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-azure-blue hover:underline inline-flex items-center mt-1"
              >
                Follow this Azure guide
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              <br />
              Make sure your service principal has <strong>Contributor</strong> role on the subscription.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="azure"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Add Subscription'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}