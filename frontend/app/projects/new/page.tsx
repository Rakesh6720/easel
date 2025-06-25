"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Loader2,
  ChevronDown,
  Settings
} from "lucide-react"
import Link from "next/link"
import { azureService, AzureCredential } from "@/lib/azure"

interface ProjectData {
  name: string
  requirements: string
  azureCredentialId: number | null
}

type Step = 'details' | 'analysis' | 'conversation' | 'recommendations'

export default function NewProjectPage() {
  const [currentStep, setCurrentStep] = useState<Step>('details')

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const creds = await azureService.getCredentials()
        setCredentials(creds)
        // Auto-select default credential if available
        const defaultCred = creds.find(c => c.isDefault)
        if (defaultCred) {
          setProjectData(prev => ({ ...prev, azureCredentialId: defaultCred.id }))
        }
      } catch (error) {
        console.error('Failed to load credentials:', error)
      } finally {
        setLoadingCredentials(false)
      }
    }
    
    fetchCredentials()
  }, [])
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    requirements: '',
    azureCredentialId: null
  })
  const [credentials, setCredentials] = useState<AzureCredential[]>([])
  const [loadingCredentials, setLoadingCredentials] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', message: string}>>([])
  const [currentMessage, setCurrentMessage] = useState('')

  const handleInitialSubmit = async () => {
    if (!projectData.name || !projectData.requirements || !projectData.azureCredentialId) return
    
    setCurrentStep('analysis')
    setIsAnalyzing(true)
    
    try {
      // Actually create the project via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projectData.name,
          userRequirements: projectData.requirements,
          azureCredentialId: projectData.azureCredentialId
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error('Failed to create project')
      }

      const project = await response.json()
      
      // Use the real project data
      setAnalysisResult(`Based on your requirements for "${project.name}", I've analyzed the following:

**Application Type**: ${projectData.requirements.toLowerCase().includes('web') ? 'Web Application' : 'Backend Service'}
**Expected Scale**: Medium traffic application
**Key Components Needed**:
- User authentication and management
- Database for data storage
- API endpoints for frontend communication
- Hosting infrastructure

**Recommended Azure Resources**:
- App Service for hosting
- Azure SQL Database for data storage
- Azure Storage Account for files/assets
- Application Insights for monitoring

Would you like me to ask some follow-up questions to refine these recommendations?`)
      
      // Store the project ID for later use
      sessionStorage.setItem('currentProjectId', project.id.toString())
      
      setIsAnalyzing(false)
      setCurrentStep('conversation')
    } catch (error) {
      console.error('Error creating project:', error)
      setIsAnalyzing(false)
      // Show error to user
      alert('Failed to create project. Please try again.')
    }
  }

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return

    const newConversation = [
      ...conversation,
      { role: 'user' as const, message: currentMessage },
      { 
        role: 'assistant' as const, 
        message: "Thank you for the additional information. Based on your clarification, I'll adjust the resource recommendations to better fit your specific needs. Let me know if you have any other requirements or questions!"
      }
    ]
    
    setConversation(newConversation)
    setCurrentMessage('')
  }

  const handleGenerateRecommendations = () => {
    setCurrentStep('recommendations')
  }

  const stepTitles = {
    details: 'Project Details',
    analysis: 'AI Analysis',
    conversation: 'Refine Requirements', 
    recommendations: 'Resource Recommendations'
  }

  const stepDescriptions = {
    details: 'Tell us what you want to build',
    analysis: 'AI is analyzing your requirements',
    conversation: 'Chat with AI to refine your needs',
    recommendations: 'Review and approve Azure resources'
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          <Link href="/projects" className="hover:text-azure-blue">Projects</Link>
          <span>/</span>
          <span>New Project</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-muted-foreground">
          Describe your application and let AI recommend the perfect Azure resources
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {Object.entries(stepTitles).map(([step, title], index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center space-x-2 ${
                currentStep === step ? 'text-azure-blue' : 
                Object.keys(stepTitles).indexOf(currentStep) > index ? 'text-azure-green' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step ? 'border-azure-blue bg-azure-blue text-white' :
                  Object.keys(stepTitles).indexOf(currentStep) > index ? 'border-azure-green bg-azure-green text-white' :
                  'border-gray-300'
                }`}>
                  {Object.keys(stepTitles).indexOf(currentStep) > index ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="font-medium">{title}</span>
              </div>
              {index < Object.keys(stepTitles).length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  Object.keys(stepTitles).indexOf(currentStep) > index ? 'bg-azure-green' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-azure-blue" />
            <span>{stepTitles[currentStep]}</span>
          </CardTitle>
          <CardDescription>
            {stepDescriptions[currentStep]}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., My E-commerce Platform"
                  value={projectData.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requirements">Describe what you want to build</Label>
                <Textarea
                  id="requirements"
                  placeholder="Describe your application in natural language. For example: 'I need a web application for an online store with user accounts, product catalog, shopping cart, payment processing, and an admin panel to manage inventory. It should handle about 1000 users and integrate with payment providers like Stripe.'"
                  className="min-h-[200px]"
                  value={projectData.requirements}
                  onChange={(e) => setProjectData(prev => ({ ...prev, requirements: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Be as detailed as possible. Include expected user volume, specific features, integrations, and any technical preferences.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="azureCredential">Azure Subscription</Label>
                {loadingCredentials ? (
                  <div className="flex items-center space-x-2 p-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading credentials...</span>
                  </div>
                ) : credentials.length === 0 ? (
                  <div className="p-3 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      No Azure credentials found. You need to add Azure credentials first.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Credentials
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        disabled={credentials.length === 0}
                      >
                        {projectData.azureCredentialId 
                          ? credentials.find(c => c.id === projectData.azureCredentialId)?.displayName
                          : "Select Azure subscription"
                        }
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {credentials.map((credential) => (
                        <DropdownMenuItem
                          key={credential.id}
                          onClick={() => setProjectData(prev => ({ ...prev, azureCredentialId: credential.id }))}
                          className="flex flex-col items-start"
                        >
                          <div className="font-medium">{credential.displayName}</div>
                          <div className="text-xs text-muted-foreground">{credential.subscriptionName}</div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <p className="text-xs text-muted-foreground">
                  Resources will be created in the selected Azure subscription.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" asChild>
                  <Link href="/projects">Cancel</Link>
                </Button>
                <Button 
                  onClick={handleInitialSubmit}
                  disabled={!projectData.name || !projectData.requirements || !projectData.azureCredentialId}
                  variant="azure"
                >
                  Analyze Requirements
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'analysis' && (
            <div className="space-y-6">
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-azure-blue" />
                  <h3 className="text-lg font-semibold mb-2">Analyzing Your Requirements</h3>
                  <p className="text-muted-foreground">
                    AI is processing your description and identifying the optimal Azure resources...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-azure-gradient-subtle p-6 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-azure-blue" />
                      AI Analysis Result
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      {analysisResult.split('\n').map((line, index) => (
                        <p key={index} className="mb-2 last:mb-0">
                          {line.startsWith('**') ? (
                            <strong>{line.replace(/\*\*/g, '')}</strong>
                          ) : (
                            line
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep('details')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Details
                    </Button>
                    <Button 
                      variant="azure"
                      onClick={() => setCurrentStep('conversation')}
                    >
                      Continue Conversation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'conversation' && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 h-64 overflow-y-auto">
                {conversation.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>Ask questions or provide additional details to refine your project requirements</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversation.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-azure-blue text-white' 
                            : 'bg-white border'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Ask a question or provide more details..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                  Send
                </Button>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep('analysis')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Analysis
                </Button>
                <Button 
                  variant="azure"
                  onClick={handleGenerateRecommendations}
                >
                  Generate Recommendations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'recommendations' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-azure-green mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Recommendations Ready!</h3>
                <p className="text-muted-foreground">
                  Review your Azure resource recommendations and provision them to your subscription
                </p>
                <Button className="mt-6" variant="azure" asChild>
                  <Link href={`/projects/${sessionStorage.getItem('currentProjectId') || '1'}/recommendations`}>
                    View Recommendations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}