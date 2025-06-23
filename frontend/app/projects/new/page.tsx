"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface ProjectData {
  name: string
  requirements: string
}

type Step = 'details' | 'analysis' | 'conversation' | 'recommendations'

export default function NewProjectPage() {
  const [currentStep, setCurrentStep] = useState<Step>('details')
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    requirements: ''
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', message: string}>>([])
  const [currentMessage, setCurrentMessage] = useState('')

  const handleInitialSubmit = async () => {
    if (!projectData.name || !projectData.requirements) return
    
    setCurrentStep('analysis')
    setIsAnalyzing(true)
    
    // Simulate API call to analyze requirements
    setTimeout(() => {
      setAnalysisResult(`Based on your requirements for "${projectData.name}", I've identified the following:

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
      
      setIsAnalyzing(false)
      setCurrentStep('conversation')
    }, 3000)
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

              <div className="flex justify-end space-x-3">
                <Button variant="outline" asChild>
                  <Link href="/projects">Cancel</Link>
                </Button>
                <Button 
                  onClick={handleInitialSubmit}
                  disabled={!projectData.name || !projectData.requirements}
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
                  <Link href="/projects/1/recommendations">
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