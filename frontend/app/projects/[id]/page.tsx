"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Settings,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Server,
  DollarSign,
  Calendar,
  MessageSquare,
  Activity,
  AlertTriangle
} from "lucide-react"
import { formatCurrency, formatDate, getStatusColor, getResourceTypeIcon } from "@/lib/utils"
import Link from "next/link"
import { useParams } from "next/navigation"

// Mock data - in real app this would come from API based on project ID
const project = {
  id: 1,
  name: "E-commerce Platform",
  description: "Full-stack e-commerce solution with payment processing",
  status: "Active",
  resourceCount: 8,
  monthlyCost: 425.32,
  createdAt: "2024-01-15T10:30:00Z",
  lastUpdated: "2024-01-20T14:22:00Z",
  requirements: "Need a scalable e-commerce platform with user authentication, product catalog, shopping cart, and payment integration. Expected to handle 1000+ concurrent users with room for growth.",
  processedRequirements: "Application Type: E-commerce Web Application\nExpected Scale: Medium to high traffic\nKey Features: User auth, product catalog, cart, payments\nPerformance: Handle 1000+ concurrent users\nIntegrations: Payment providers (Stripe/PayPal)\nSecurity: PCI compliance considerations"
}

const resources = [
  {
    id: 1,
    name: "ecommerce-app-service",
    type: "microsoft.web/sites",
    status: "Active",
    location: "East US",
    cost: 156.32,
    lastUpdated: "2024-01-20T14:22:00Z"
  },
  {
    id: 2,
    name: "ecommerce-sql-db",
    type: "microsoft.sql/servers/databases",
    status: "Active", 
    location: "East US",
    cost: 198.45,
    lastUpdated: "2024-01-20T12:15:00Z"
  },
  {
    id: 3,
    name: "ecommerce-storage",
    type: "microsoft.storage/storageaccounts",
    status: "Active",
    location: "East US", 
    cost: 45.21,
    lastUpdated: "2024-01-20T10:30:00Z"
  },
  {
    id: 4,
    name: "ecommerce-insights",
    type: "microsoft.insights/components",
    status: "Active",
    location: "East US",
    cost: 25.34,
    lastUpdated: "2024-01-20T09:45:00Z"
  }
]

const conversations = [
  {
    id: 1,
    userMessage: "I need to add Redis caching for better performance",
    assistantResponse: "Great idea! Redis caching will significantly improve your e-commerce platform's performance. I recommend Azure Cache for Redis with the Basic C1 tier to start. This will provide 1GB cache and handle your current load efficiently. Would you like me to add this to your resource recommendations?",
    createdAt: "2024-01-19T16:30:00Z"
  },
  {
    id: 2,
    userMessage: "What about CDN for static assets?",
    assistantResponse: "Absolutely! Azure CDN will improve load times for your static assets like images and CSS. I recommend Azure CDN Standard from Microsoft with global distribution. This will cache your content closer to users worldwide and reduce bandwidth costs on your App Service.",
    createdAt: "2024-01-19T15:45:00Z"
  }
]

export default function ProjectDetailPage() {
  const params = useParams()
  
  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-azure-blue flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Projects
        </Link>
        <span>/</span>
        <span>{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 azure-gradient rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {project.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-muted-foreground mb-3">{project.description}</p>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {project.resourceCount} resources
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(project.monthlyCost)}/month
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(project.monthlyCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resources</p>
                <p className="text-2xl font-bold">{project.resourceCount}</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">99.9%</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alerts</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resources */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Azure Resources</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${params.id}/resources`}>
                  View All
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resources.map((resource) => (
                <Link 
                  key={resource.id} 
                  href={`/projects/${params.id}/resources/${resource.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 hover:border-azure-blue transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getResourceTypeIcon(resource.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{resource.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{resource.type}</span>
                          <span>{resource.location}</span>
                          <span>{formatCurrency(resource.cost)}/month</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(resource.status)}>
                        {resource.status}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Info */}
        <div className="space-y-6">
          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Original Requirements</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.requirements}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Analysis</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {project.processedRequirements.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Conversations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI Conversations</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${params.id}/chat`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversations.slice(0, 2).map((conv) => (
                  <div key={conv.id} className="border-l-2 border-azure-blue pl-4">
                    <p className="text-sm font-medium mb-1">You:</p>
                    <p className="text-sm text-muted-foreground mb-2">{conv.userMessage}</p>
                    <p className="text-sm font-medium mb-1">Easel AI:</p>
                    <p className="text-sm text-muted-foreground">{conv.assistantResponse.substring(0, 100)}...</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(conv.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Project Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(project.lastUpdated)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Project ID</span>
                  <span className="font-mono">{project.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}