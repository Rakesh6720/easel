"use client";

import { useState, useEffect } from "react";
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
  getStatusText,
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
import {
  projectsService,
  type Project,
  type AzureResource,
  type ProjectConversation,
} from "@/lib/projects";
import { isTestUser } from "@/lib/test-user";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);

  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<AzureResource[]>([]);
  const [conversations, setConversations] = useState<ProjectConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Project details page loading, projectId:", projectId);
    console.log("Is test user:", isTestUser());

    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use projectsService for both test and real users (it handles the test user logic internally)
        console.log("Loading project data via projectsService");
        const projectData = await projectsService.getProject(projectId);
        const resourcesData = await projectsService.getProjectResources(
          projectId
        );
        const conversationsData = await projectsService.getProjectConversations(
          projectId
        );

        console.log("Project data:", projectData);
        console.log("Resources data:", resourcesData);
        console.log("Conversations data:", conversationsData);

        setProject(projectData);
        setResources(resourcesData);
        setConversations(conversationsData);
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError("Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Project Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            {error || "The requested project could not be found."}
          </p>
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate project stats from resources
  const resourceCount = resources.length;
  const monthlyCost = resources.reduce(
    (sum, resource) => sum + (resource.estimatedMonthlyCost || 0),
    0
  );

  // Helper function to normalize status for comparison
  const isStatus = (resource: any, statusName: string) => {
    const status = resource.status;
    if (typeof status === "number") {
      switch (statusName) {
        case "Active":
          return status === 2;
        case "Failed":
          return status === 3;
        case "Provisioning":
          return status === 1;
        case "Planned":
          return status === 0;
        case "Deleting":
          return status === 4;
        case "Deleted":
          return status === 5;
        default:
          return false;
      }
    }
    return String(status).toLowerCase() === statusName.toLowerCase();
  };

  const activeResources = resources.filter((r) => isStatus(r, "Active")).length;
  const failedResources = resources.filter((r) => isStatus(r, "Failed")).length;
  const provisioningResources = resources.filter((r) =>
    isStatus(r, "Provisioning")
  ).length;

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
                {resourceCount} resources
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(monthlyCost)}/month
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
                  {formatCurrency(monthlyCost)}
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
                  Active Resources
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {activeResources}
                </p>
              </div>
              <Server className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Show failed resources prominently if any exist */}
        {failedResources > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Failed Resources
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {failedResources}
                  </p>
                  <p className="text-xs text-red-600 mt-1">Require attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show provisioning resources if any */}
        {provisioningResources > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Provisioning
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {provisioningResources}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">In progress</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Resources
                </p>
                <p className="text-2xl font-bold">{resourceCount}</p>
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
            {/* Add failure summary at the top if there are failed resources */}
            {failedResources > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">
                    {failedResources} Resource{failedResources > 1 ? "s" : ""}{" "}
                    Failed to Provision
                  </h4>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Some resources couldn't be created. Review the failed
                  resources below and try reprovisioning them.
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Retry All Failed
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:bg-red-100"
                  >
                    View Logs
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {resources.map((resource) => {
                const statusText = getStatusText(resource.status);
                const isFailed = isStatus(resource, "Failed");
                const isProvisioning = isStatus(resource, "Provisioning");

                return (
                  <div
                    key={resource.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isFailed
                        ? "border-red-200 bg-red-50 hover:border-red-300"
                        : isProvisioning
                        ? "border-blue-200 bg-blue-50 hover:border-blue-300"
                        : "hover:bg-muted/50 hover:border-azure-blue"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getResourceTypeIcon(resource.resourceType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{resource.name}</h4>
                            {isFailed && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span>{resource.resourceType}</span>
                            <span>{resource.location}</span>
                            <span>
                              {formatCurrency(
                                resource.estimatedMonthlyCost || 0
                              )}
                              /month
                            </span>
                          </div>
                          {isFailed && (
                            <div className="mt-2 text-sm text-red-700">
                              <p>
                                ⚠️ Provisioning failed. This may be due to quota
                                limits, naming conflicts, or permission issues.
                              </p>
                            </div>
                          )}
                          {isProvisioning && (
                            <div className="mt-2 text-sm text-blue-700">
                              <p>
                                🔄 Resource is being provisioned. This may take
                                several minutes.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(resource.status)}>
                          {statusText}
                        </Badge>
                        {isFailed && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-100"
                          >
                            Retry
                          </Button>
                        )}
                        <Link
                          href={`/projects/${params.id}/resources/${resource.id}`}
                        >
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    {project.userRequirements}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Analysis</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {project.processedRequirements
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
                      {conv.assistantResponse?.substring(0, 100) ||
                        "No response available"}
                      ...
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
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Project ID</span>
                  <span className="font-mono">{project?.id || projectId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
