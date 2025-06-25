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
import {
  getProjectRequirements,
  getProcessedRequirements,
  getConversationsForProject,
} from "@/lib/mock-project-details";
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
