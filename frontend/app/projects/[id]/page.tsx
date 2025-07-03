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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Lightbulb,
  CheckCircle,
  Zap,
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
import { azureService, type AzureCredential } from "@/lib/azure";
import { isTestUser } from "@/lib/test-user";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, useRouter } from "next/navigation";
import { AzureSubscriptionUpgrade } from "@/components/azure-subscription-upgrade";
import { AzurePermissionError } from "@/components/azure-permission-error";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string, 10);

  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<AzureResource[]>([]);
  const [conversations, setConversations] = useState<ProjectConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingResources, setRetryingResources] = useState<Set<number>>(
    new Set()
  );
  const [retryingAll, setRetryingAll] = useState(false);
  const [azureCredentials, setAzureCredentials] = useState<AzureCredential[]>([]);
  const [assigningCredential, setAssigningCredential] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<string>>(new Set());

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

        // Load Azure credentials
        const credentialsData = await azureService.getCredentials();
        console.log("Azure credentials data:", credentialsData);
        console.log("Project userAzureCredentialId:", projectData.userAzureCredentialId);
        console.log("Should show credentials component:", !projectData.userAzureCredentialId && credentialsData.length > 0);
        setAzureCredentials(credentialsData);
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError("Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleRetryResource = async (resourceId: number) => {
    try {
      setRetryingResources((prev) => new Set(prev).add(resourceId));

      await projectsService.retryResource(projectId, resourceId);

      // Give the backend a moment to process the request and update the database
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh the project data to show updated resource status
      const updatedProject = await projectsService.getProject(projectId);
      const updatedResources = await projectsService.getProjectResources(
        projectId
      );
      setProject(updatedProject);
      setResources(updatedResources);
    } catch (err) {
      console.error("Error retrying resource:", err);
      setError("Failed to retry resource");
    } finally {
      setRetryingResources((prev) => {
        const newSet = new Set(prev);
        newSet.delete(resourceId);
        return newSet;
      });
    }
  };

  const handleRetryAllFailed = async () => {
    try {
      setRetryingAll(true);

      await projectsService.retryAllFailedResources(projectId);

      // Give the backend a moment to process the request and update the database
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh the project data to show updated resource statuses
      const updatedProject = await projectsService.getProject(projectId);
      const updatedResources = await projectsService.getProjectResources(
        projectId
      );
      setProject(updatedProject);
      setResources(updatedResources);
    } catch (err) {
      console.error("Error retrying all failed resources:", err);
      setError("Failed to retry failed resources");
    } finally {
      setRetryingAll(false);
    }
  };

  const handleAssignCredential = async (credentialId: string) => {
    try {
      setAssigningCredential(true);
      
      await projectsService.assignAzureCredential(projectId, parseInt(credentialId));
      
      // Refresh the project data to show updated credential
      const updatedProject = await projectsService.getProject(projectId);
      setProject(updatedProject);
      
      setError(null);
    } catch (err) {
      console.error("Error assigning Azure credential:", err);
      setError("Failed to assign Azure credential");
    } finally {
      setAssigningCredential(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      // First call to get confirmation details
      const confirmationData = await projectsService.deleteProject(projectId, false);
      setDeleteConfirmation(confirmationData);
      setShowDeleteDialog(true);
    } catch (err) {
      console.error("Error getting delete confirmation:", err);
      setError("Failed to prepare project deletion");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      // Second call to perform actual deletion
      await projectsService.deleteProject(projectId, true);
      
      // Navigate back to projects list
      router.push("/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project");
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      setError(null);
      
      const recommendationsData = await projectsService.generateRecommendations(projectId);
      
      // Add stable IDs to recommendations and auto-select all by default
      const recommendationsWithIds = recommendationsData.map((rec: any, index: number) => ({
        ...rec,
        id: rec.id || `rec_${index}`
      }));
      setRecommendations(recommendationsWithIds);
      
      // Auto-select all recommendations by default
      const allIds = new Set(recommendationsWithIds.map((rec: any) => rec.id));
      setSelectedRecommendations(allIds);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setError("Failed to generate recommendations");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleProvisionResources = async () => {
    try {
      setProvisioning(true);
      setError(null);
      
      // Get selected recommendations
      const selectedRecs = recommendations.filter(rec => 
        selectedRecommendations.has(rec.id)
      );
      
      if (selectedRecs.length === 0) {
        setError("Please select at least one recommendation to provision");
        return;
      }
      
      await projectsService.provisionResources(projectId, selectedRecs);
      
      // Refresh project data to show new resources
      const updatedProject = await projectsService.getProject(projectId);
      const updatedResources = await projectsService.getProjectResources(projectId);
      setProject(updatedProject);
      setResources(updatedResources);
      
      // Clear recommendations after successful provisioning
      setRecommendations([]);
      setSelectedRecommendations(new Set());
    } catch (err) {
      console.error("Error provisioning resources:", err);
      setError("Failed to provision resources");
    } finally {
      setProvisioning(false);
    }
  };

  const handleToggleRecommendation = (recId: string) => {
    setSelectedRecommendations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recId)) {
        newSet.delete(recId);
      } else {
        newSet.add(recId);
      }
      return newSet;
    });
  };

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
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteProject}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Loading..." : "Delete"}
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

      {/* Azure Credential Assignment */}
      {!project?.userAzureCredentialId && azureCredentials.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Azure Credentials Required</CardTitle>
            <CardDescription className="text-orange-700">
              This project needs Azure credentials to provision resources. Please assign Azure credentials to enable resource provisioning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Select onValueChange={handleAssignCredential} disabled={assigningCredential}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Azure credential" />
                </SelectTrigger>
                <SelectContent>
                  {azureCredentials.map((credential) => (
                    <SelectItem key={credential.id} value={credential.id.toString()}>
                      {credential.subscriptionName || credential.subscriptionId}
                      {credential.isDefault && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assigningCredential && (
                <div className="text-sm text-orange-700">Assigning credential...</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Azure Permission Error - Show this FIRST if credentials are failing */}
      {project?.userAzureCredentialId && azureCredentials.find(c => c.id === project.userAzureCredentialId && !c.isActive) && (
        <AzurePermissionError 
          credentialName={azureCredentials.find(c => c.id === project.userAzureCredentialId)?.subscriptionName}
          servicePrincipalId={azureCredentials.find(c => c.id === project.userAzureCredentialId)?.clientId}
          subscriptionId={azureCredentials.find(c => c.id === project.userAzureCredentialId)?.subscriptionId}
        />
      )}

      {/* Azure Subscription Upgrade Helper */}
      {failedResources > 0 && (
        <AzureSubscriptionUpgrade />
      )}

      {/* Generate Recommendations Section */}
      {project?.userAzureCredentialId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Resource Recommendations
            </CardTitle>
            <CardDescription className="text-blue-700">
              Generate AI-powered Azure resource recommendations for your project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center py-4">
                <Button 
                  onClick={handleGenerateRecommendations}
                  disabled={loadingRecommendations}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {loadingRecommendations ? "Generating..." : "Generate Recommendations"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-700">
                    {recommendations.length} recommendations generated
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleGenerateRecommendations}
                      disabled={loadingRecommendations}
                    >
                      Regenerate
                    </Button>
                    <Button 
                      onClick={handleProvisionResources}
                      disabled={provisioning || selectedRecommendations.size === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {provisioning ? "Provisioning..." : `Provision Selected (${selectedRecommendations.size})`}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {recommendations.map((rec) => {
                    const recId = rec.id;
                    const isSelected = selectedRecommendations.has(recId);
                    
                    return (
                      <div 
                        key={recId}
                        className={`p-4 border rounded-lg transition-all ${
                          isSelected ? 'border-blue-300 bg-blue-100' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRecommendation(recId)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl">
                                  {getResourceTypeIcon(rec.resourceType)}
                                </div>
                                <div>
                                  <h4 className="font-semibold">{rec.name}</h4>
                                  <p className="text-sm text-muted-foreground">{rec.resourceType}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(rec.estimatedMonthlyCost || 0)}/month
                                </p>
                                <p className="text-sm text-muted-foreground">{rec.location}</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {rec.reasoning || rec.description || rec.justification}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    onClick={handleRetryAllFailed}
                    disabled={retryingAll}
                  >
                    {retryingAll ? "Retrying..." : "Retry All Failed"}
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
                            onClick={() => handleRetryResource(resource.id)}
                            disabled={retryingResources.has(resource.id)}
                          >
                            {retryingResources.has(resource.id)
                              ? "Retrying..."
                              : "Retry"}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirmation && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">
                  "{deleteConfirmation.projectName}"
                </h4>
                <div className="text-sm text-red-700 space-y-1">
                  <p>• {deleteConfirmation.resourceCount} resources will be affected</p>
                  <p>• Estimated monthly cost: {formatCurrency(deleteConfirmation.estimatedMonthlyCost)}</p>
                  <p className="mt-2 text-xs">{deleteConfirmation.message}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Project"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
