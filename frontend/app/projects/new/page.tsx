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
import { projectsService } from "@/lib/projects"

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

  const formatAIMessage = (message: string) => {
    return message.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return null;
      
      // Handle section headers (lines starting with **)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <div key={index} className="mt-3 first:mt-0">
            <h5 className="font-semibold text-azure-blue mb-1 text-sm">
              {trimmedLine.replace(/\*\*/g, '')}
            </h5>
          </div>
        );
      }
      
      // Handle bullet points (lines starting with -)
      if (trimmedLine.startsWith('- ')) {
        return (
          <div key={index} className="ml-3 flex items-start mt-1">
            <div className="w-1.5 h-1.5 bg-azure-blue rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
            <p className="text-sm leading-relaxed">
              {trimmedLine.substring(2)}
            </p>
          </div>
        );
      }
      
      // Handle regular paragraphs
      return (
        <p key={index} className="text-sm leading-relaxed mt-1 first:mt-0">
          {trimmedLine}
        </p>
      );
    }).filter(Boolean);
  };

  const handleInitialSubmit = async () => {
    if (!projectData.name || !projectData.requirements || !projectData.azureCredentialId) return
    
    setCurrentStep('analysis')
    setIsAnalyzing(true)
    
    try {
      // Create the project via API service
      const project = await projectsService.createProject({
        name: projectData.name,
        userRequirements: projectData.requirements,
        azureCredentialId: projectData.azureCredentialId
      })
      
      // Use the real project data
      setAnalysisResult(`Based on your requirements for "${project.name}", I need to understand your architecture better to provide the best Azure resource recommendations.

**Initial Assessment**:
Your project appears to need cloud infrastructure, but I'd like to clarify the specific architecture you have in mind.

**Next Steps**:
I'll ask you a few questions in the conversation below to understand:
- What type of application architecture you're building
- Your expected scale and performance needs
- Any specific requirements or constraints

This will help me recommend the most suitable Azure services for your specific use case.`)
      
      // Store the project ID for later use
      sessionStorage.setItem('currentProjectId', project.id.toString())
      
      // Initialize conversation with a welcoming message
      setConversation([
        {
          role: 'assistant',
          message: `Hi! I've done an initial analysis of your "${project.name}" project requirements. 

To give you the best Azure resource recommendations, what type of application architecture are you building?

For example: web application, API gateway, microservices, data processing platform, or something else?`
        }
      ])
      
      setIsAnalyzing(false)
      setCurrentStep('conversation')
    } catch (error) {
      console.error('Error creating project:', error)
      setIsAnalyzing(false)
      // Show error to user
      alert('Failed to create project. Please try again.')
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    // Add user message immediately
    const userMessage = currentMessage;
    setConversation(prev => [...prev, { role: 'user' as const, message: userMessage }]);
    setCurrentMessage('');

    try {
      // Get the project ID from sessionStorage
      const currentProjectId = sessionStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Project ID not found');
      }
      
      // Call the AI service to get a proper response
      const response = await projectsService.addConversation(parseInt(currentProjectId), userMessage);
      
      // Add AI response to conversation
      const aiMessage = response.aiResponse || response.message || "I'll help you refine your requirements.";
      setConversation(prev => [...prev, { 
        role: 'assistant' as const, 
        message: aiMessage
      }]);
      
      // Add a follow-up prompt after a brief delay to encourage continued conversation
      setTimeout(() => {
        const followUpPrompt = generateFollowUpPrompt(userMessage, aiMessage);
        if (followUpPrompt) {
          setConversation(prev => [...prev, { 
            role: 'assistant' as const, 
            message: followUpPrompt
          }]);
        }
      }, 2000);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Provide a smart fallback response based on the user's question
      const fallbackResponse = generateSmartFallbackResponse(userMessage, projectData);
      
      setConversation(prev => [...prev, { 
        role: 'assistant' as const, 
        message: fallbackResponse
      }]);
    }
  }

  const generateFollowUpPrompt = (userMessage: string, aiResponse: string) => {
    const message = userMessage.toLowerCase();
    const response = aiResponse.toLowerCase();
    
    // Don't generate follow-up if the response already contains a question
    if (aiResponse.includes('?')) {
      return null;
    }
    
    // Generate contextual follow-up questions based on the conversation
    if (message.includes('web application') || message.includes('website')) {
      return "Great! For a web application, I'd like to understand a bit more:\n\n• What's your expected user volume (hundreds, thousands, or more)?\n• Do you need user authentication and profiles?\n• Will you be handling payments or sensitive data?";
    }
    
    if (message.includes('api') || message.includes('microservice')) {
      return "Perfect! For API/microservices architecture:\n\n• How many different services do you envision?\n• What's your expected request volume?\n• Do you need real-time features or webhooks?";
    }
    
    if (message.includes('database') || message.includes('data')) {
      return "Good to know about your data needs! Some follow-up questions:\n\n• What type of data will you store (user profiles, transactions, content)?\n• Do you need real-time analytics or reporting?\n• Any compliance requirements (GDPR, HIPAA, etc.)?";
    }
    
    if (message.includes('budget') || message.includes('cost')) {
      return "Budget is important! Let me help optimize for your budget:\n\n• What's your monthly budget range?\n• Is this for development/testing or production?\n• Any preference for pay-as-you-go vs. reserved pricing?";
    }
    
    if (message.includes('scale') || message.includes('user')) {
      return "Understanding scale helps with the right recommendations:\n\n• How many users do you expect in the first 6 months?\n• Any seasonal traffic patterns?\n• Global users or specific regions?";
    }
    
    // Default follow-ups based on conversation length
    const conversationLength = conversation.length;
    
    if (conversationLength <= 2) {
      return "What other aspects of your project would you like to discuss? I can help with:\n\n• Architecture decisions\n• Scaling considerations\n• Security requirements\n• Budget optimization";
    } else if (conversationLength <= 4) {
      return "Any other technical requirements or constraints I should know about?";
    }
    
    return null; // Stop follow-ups after sufficient conversation
  };

  const generateSmartFallbackResponse = (userMessage: string, projectData: ProjectData) => {
    const message = userMessage.toLowerCase();
    
    // Handle user load responses (thousands, hundreds, etc.)
    if (message.includes('thousand') || message.includes('1000') || message.includes('many') || message.includes('lots') || message.includes('hopefully')) {
      return `Excellent! For thousands of users, you'll need a robust architecture:

**Recommended Configuration:**
- **Azure App Service** (Standard or Premium tier) with auto-scaling
- **Azure SQL Database** (Standard tier) with read replicas
- **Azure CDN** for global content delivery
- **Azure Redis Cache** for session management and performance
- **Application Insights** for monitoring high-traffic scenarios

**Estimated Monthly Cost:** $200-500 for this scale

**Next Steps:**
Would you like me to help you plan for specific features like user authentication, file uploads, or real-time messaging?`;
    }
    
    // Handle small scale responses
    if (message.includes('hundred') || message.includes('small') || message.includes('few') || message.includes('starting')) {
      return `Perfect for getting started! For hundreds of users:

**Cost-Effective Setup:**
- **Azure App Service** (Basic tier) - $13-55/month
- **Azure SQL Database** (Basic tier) - $5-15/month
- **Azure Storage Account** - $1-10/month

**Total Estimated Cost:** $20-80/month

This setup can easily scale up as your user base grows. What features are most important for your startup platform?`;
    }
    
    // Handle web app responses
    if (message.includes('web app') || message.includes('web application') || message.includes('website')) {
      return `Perfect! For a web application like "${projectData.name}", here's what I recommend:

**Core Azure Resources:**
- **Azure App Service** - Host your web application with auto-scaling
- **Azure SQL Database** - Store user data and application content
- **Azure Storage Account** - Handle file uploads and static assets

**Additional Services:**
- **Azure CDN** - Fast content delivery globally
- **Application Insights** - Monitor performance and user behavior

**Estimated Monthly Cost:** $100-300 depending on traffic

What's your expected user load - hundreds or thousands of users?`;
    }
    
    // Handle API Gateway responses
    if (message.includes('api gateway') || message.includes('load balancer') || message.includes('microservice')) {
      return `Great choice! For an API Gateway architecture, I'd recommend:

**Core Services:**
- **Azure API Management** - Central API gateway with security and throttling
- **Azure Application Gateway** - Load balancer with WAF protection
- **Azure App Services** - Host your backend APIs

How many backend services are you planning to connect?`;
    }
    
    // Handle feature-specific questions
    if (message.includes('feature') || message.includes('auth') || message.includes('upload') || message.includes('messaging')) {
      return `Great question! For a startup platform with thousands of users, here are key feature recommendations:

**User Authentication:**
- **Azure Active Directory B2C** - Scalable user identity management

**File & Media Handling:**
- **Azure Blob Storage** - Profile pictures, documents
- **Azure Media Services** - Video content (if needed)

**Real-time Features:**
- **Azure SignalR** - Live messaging, notifications
- **Azure Service Bus** - Background job processing

Would you like me to dive deeper into any of these features?`;
    }
    
    // Handle resource recommendation questions
    if (message.includes('resource') || message.includes('recommend')) {
      return `I'd love to help you choose the right Azure resources for "${projectData.name}"! 

What type of architecture are you thinking about - web app, API gateway, microservices, or something else?`;
    }
    
    // Handle budget questions
    if (message.includes('budget') || message.includes('cost') || message.includes('price')) {
      return `Here are typical Azure costs for "${projectData.name}":

**Small project:** $50-150/month (Basic tiers)
**Medium project:** $150-500/month (Standard tiers)
**Large project:** $500+/month (Premium + extras)

What's your target budget range?`;
    }
    
    // Default response - be more conversational
    return `That's helpful context! For "${projectData.name}" with thousands of users, I'd recommend focusing on:

**Scalability** - Services that can grow with your user base
**Performance** - Fast response times for a great user experience  
**Cost optimization** - Smart resource choices for a startup budget

What aspect would you like to explore first - the core infrastructure, specific features, or cost planning?`;
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
                    <div className="space-y-4">
                      {analysisResult.split('\n').map((line, index) => {
                        const trimmedLine = line.trim();
                        
                        // Skip empty lines
                        if (!trimmedLine) return null;
                        
                        // Handle section headers (lines starting with **)
                        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                          return (
                            <div key={index} className="mt-4 first:mt-0">
                              <h4 className="font-semibold text-azure-blue mb-2">
                                {trimmedLine.replace(/\*\*/g, '')}
                              </h4>
                            </div>
                          );
                        }
                        
                        // Handle bullet points (lines starting with -)
                        if (trimmedLine.startsWith('- ')) {
                          return (
                            <div key={index} className="ml-4 flex items-start">
                              <div className="w-2 h-2 bg-azure-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <p className="text-gray-700 leading-relaxed">
                                {trimmedLine.substring(2)}
                              </p>
                            </div>
                          );
                        }
                        
                        // Handle regular paragraphs
                        return (
                          <p key={index} className="text-gray-700 leading-relaxed">
                            {trimmedLine}
                          </p>
                        );
                      }).filter(Boolean)}
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
                          {msg.role === 'assistant' ? (
                            <div className="space-y-1">
                              {formatAIMessage(msg.message)}
                            </div>
                          ) : (
                            msg.message
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder={conversation.length === 0 
                    ? "Ask a question or provide more details..." 
                    : "Continue the conversation..."}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                  Send
                </Button>
              </div>

              {conversation.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  💬 Keep asking questions to refine your requirements, or generate recommendations when ready
                </div>
              )}

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
                  className={conversation.length > 0 ? "" : "opacity-50"}
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