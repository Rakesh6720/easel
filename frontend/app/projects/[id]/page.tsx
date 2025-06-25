"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getResourceTypeIcon,
} from "@/lib/utils";
import {
  getProjectInfo,
  getResourcesForProject,
} from "@/lib/mock-resource-data";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);

  // Get project-specific data
  const project = getProjectInfo(projectId);
  const resources = getResourcesForProject(projectId);

  // Calculate project stats from resources
  const resourceCount = resources.length;
  const monthlyCost = resources.reduce(
    (sum, resource) => sum + resource.cost,
    0
  );
  const activeResources = resources.filter(
    (r) => r.status === "running" || r.status === "Active"
  ).length;

  // Helper functions for project-specific requirements
  function getProjectRequirements(projectId: number): string {
    const requirements: Record<number, string> = {
      1: "Need a scalable e-commerce platform with user authentication, product catalog, shopping cart, and payment integration. Expected to handle 1000+ concurrent users with room for growth.",
      2: "Real-time analytics dashboard for processing and visualizing large datasets. Need to handle streaming data, generate reports, and provide insights with low latency.",
      3: "Backend API services for mobile application. Need user authentication, push notifications, caching layer, and real-time features for chat and updates.",
    };
    return requirements[projectId] || "Project requirements not specified.";
  }

  function getProcessedRequirements(projectId: number): string {
    const processed: Record<number, string> = {
      1: "Application Type: E-commerce Web Application\nExpected Scale: Medium to high traffic\nKey Features: User auth, product catalog, cart, payments\nPerformance: Handle 1000+ concurrent users\nIntegrations: Payment providers (Stripe/PayPal)\nSecurity: PCI compliance considerations",
      2: "Application Type: Analytics & Data Processing\nExpected Scale: High volume data ingestion\nKey Features: Real-time processing, dashboards, reporting\nPerformance: Low latency queries, streaming data\nIntegrations: Data sources, visualization tools\nSecurity: Data encryption, access controls",
      3: "Application Type: Mobile Backend API\nExpected Scale: Mobile app with growing user base\nKey Features: REST API, push notifications, real-time chat\nPerformance: Fast response times, caching\nIntegrations: Mobile SDKs, notification services\nSecurity: JWT authentication, rate limiting",
    };
    return (
      processed[projectId] ||
      "Application Type: Unknown\nRequirements processing needed."
    );
  }

  function getConversationsForProject(projectId: number) {
    const allConversations: Record<
      number,
      Array<{
        id: number;
        userMessage: string;
        assistantResponse: string;
        createdAt: string;
      }>
    > = {
      1: [
        {
          id: 1,
          userMessage: "I need to add Redis caching for better performance",
          assistantResponse:
            "Great idea! Redis caching will significantly improve your e-commerce platform's performance. I recommend Azure Cache for Redis with the Basic C1 tier to start. This will provide 1GB cache and handle your current load efficiently. Would you like me to add this to your resource recommendations?",
          createdAt: "2024-01-19T16:30:00Z",
        },
        {
          id: 2,
          userMessage: "What about CDN for static assets?",
          assistantResponse:
            "Absolutely! Azure CDN will improve load times for your static assets like images and CSS. I recommend Azure CDN Standard from Microsoft with global distribution. This will cache your content closer to users worldwide and reduce bandwidth costs on your App Service.",
          createdAt: "2024-01-19T15:45:00Z",
        },
      ],
      2: [
        {
          id: 3,
          userMessage:
            "How can I optimize my analytics pipeline for real-time processing?",
          assistantResponse:
            "For real-time analytics, I recommend Azure Stream Analytics paired with Event Hubs. This combination provides low-latency processing and can handle high-volume data streams. We should also consider Azure Synapse Analytics for complex analytical workloads.",
          createdAt: "2024-01-21T09:15:00Z",
        },
        {
          id: 4,
          userMessage: "What about data visualization tools?",
          assistantResponse:
            "Power BI integrates seamlessly with your Azure analytics stack. You can connect it directly to your data sources and create interactive dashboards. For real-time visualization, consider using Power BI streaming datasets.",
          createdAt: "2024-01-21T08:30:00Z",
        },
      ],
      3: [
        {
          id: 5,
          userMessage: "I need push notification support for my mobile app",
          assistantResponse:
            "Azure Notification Hubs is perfect for this! It supports cross-platform push notifications and can scale to millions of devices. I'll help you set up templates for iOS and Android notifications with personalization support.",
          createdAt: "2024-01-21T11:20:00Z",
        },
        {
          id: 6,
          userMessage: "How should I implement real-time chat features?",
          assistantResponse:
            "Azure SignalR Service is ideal for real-time communication features. It handles WebSocket connections automatically and scales horizontally. We can integrate it with your API to provide instant messaging, presence indicators, and group chat functionality.",
          createdAt: "2024-01-21T10:45:00Z",
        },
      ],
    };
    return allConversations[projectId] || [];
  }

  // Enhanced project data with defaults for display
  const projectData = {
    id: projectId,
    name: project.name,
    description: project.description,
    status: project.status,
    environment: project.environment,
    resourceCount,
    monthlyCost,
    createdAt: "2024-01-15T10:30:00Z", // Could be enhanced with real creation dates
    lastUpdated: project.lastDeployed,
    requirements: getProjectRequirements(projectId),
    processedRequirements: getProcessedRequirements(projectId),
  };

  const conversations = getConversationsForProject(projectId);

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/projects"
          className="hover:text-azure-blue flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Projects
        </Link>
        <span>/</span>
        <span>{projectData.name}</span>
      </div>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 azure-gradient rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {projectData.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {projectData.name}
            </h1>
            <p className="text-muted-foreground mb-3">
              {projectData.description}
            </p>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(projectData.status)}>
                {projectData.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {projectData.resourceCount} resources
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(projectData.monthlyCost)}/month
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
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Cost
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(projectData.monthlyCost)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Resources
                </p>
                <p className="text-2xl font-bold">
                  {projectData.resourceCount}
                </p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Uptime
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Alerts
                </p>
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
                    {projectData.requirements}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Analysis</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {projectData.processedRequirements
                      .split("\n")
                      .map((line: string, index: number) => (
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
                {conversations.slice(0, 2).map((conv: any) => (
                  <div
                    key={conv.id}
                    className="border-l-2 border-azure-blue pl-4"
                  >
                    <p className="text-sm font-medium mb-1">You:</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {conv.userMessage}
                    </p>
                    <p className="text-sm font-medium mb-1">Easel AI:</p>
                    <p className="text-sm text-muted-foreground">
                      {conv.assistantResponse.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(conv.createdAt)}
                    </p>
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
                  <span>{formatDate(projectData.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(projectData.lastUpdated)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Project ID</span>
                  <span className="font-mono">{projectData.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
