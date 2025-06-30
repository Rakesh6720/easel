"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, ExternalLink, AlertTriangle } from "lucide-react";
import { getResourcesForProject } from "@/lib/mock-resource-data";
import { projectsService, type AzureResource } from "@/lib/projects";
import { isTestUser } from "@/lib/test-user";
import { getStatusColor, getStatusText } from "@/lib/utils";

export default function ProjectResourcesPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isTestUser()) {
          // Use mock data for test user
          const mockResources = getResourcesForProject(projectId);
          setResources(mockResources);
        } else {
          // Fetch real data for other users
          const project = await projectsService.getProject(projectId);
          if (project?.resources) {
            // Convert API resources to the expected format for the UI
            const formattedResources = project.resources.map(
              (resource: AzureResource) => ({
                id: resource.id,
                name: resource.name,
                type: resource.resourceType,
                status: resource.status || "unknown",
                region: resource.location || "Unknown",
                resourceGroup: "default-rg", // Not available in API, use default
                createdAt: resource.createdAt || new Date().toISOString(),
                cost: resource.estimatedMonthlyCost || 0,
                azureResourceId: "", // Not available in API
                configuration: resource.configuration || {},
              })
            );
            setResources(formattedResources);
          } else {
            setResources([]);
          }
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
        setError("Failed to load resources");
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [projectId]);

  // Get resources for this project - this is now set by useEffect
  // const resources = getResourcesForProject(parseInt(projectId, 10));

  const handleConfigure = (resource: any) => {
    setSelectedResource(resource);
  };

  const renderConfigurationContent = (resource: any) => {
    if (!resource) return null;

    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {/* Resource Type Specific Configuration */}
          {resource.type === "microsoft.web/sites" && (
            <div className="space-y-3">
              <h4 className="font-medium">App Service Configuration</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.sku}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Runtime:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.runtime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Auto Scale:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.autoScale ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {resource.type === "microsoft.sql/servers/databases" && (
            <div className="space-y-3">
              <h4 className="font-medium">SQL Database Configuration</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Tier:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Service Objective:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.serviceObjective}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Backup Retention:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.backupRetentionDays} days
                  </span>
                </div>
              </div>
            </div>
          )}

          {resource.type === "microsoft.storage/storageaccounts" && (
            <div className="space-y-3">
              <h4 className="font-medium">Storage Account Configuration</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Account Type:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.accountType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Access Tier:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.accessTier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>HTTPS Only:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.supportsHttpsTrafficOnly
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {resource.type === "microsoft.insights/components" && (
            <div className="space-y-3">
              <h4 className="font-medium">
                Application Insights Configuration
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Application Type:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.applicationType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Retention:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.retentionInDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sampling:</span>
                  <span className="text-muted-foreground">
                    {resource.configuration.samplingPercentage}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Common Actions */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/projects/${projectId}/resources/${resource.id}?tab=settings`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://portal.azure.com/#@/resource${resource.azureResourceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Azure Portal
                </a>
              </Button>
            </div>
          </div>

          {/* Note about functionality */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            💡 <strong>Note:</strong> In a full implementation, this dialog
            would include editable form fields for scaling, environment
            variables, connection strings, and other resource-specific settings.
            Currently showing read-only configuration for demonstration.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">
            Manage Azure resources for Project {projectId}
          </p>
        </div>
        <Button asChild>
          <Link href={`/projects/${projectId}/resources/new`}>
            Add Resource
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-red-600">Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-4">
                This project doesn't have any Azure resources yet.
              </p>
              <Button asChild>
                <Link href={`/projects/${projectId}/resources/new`}>
                  Add Your First Resource
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => {
            const statusText = getStatusText(resource.status);
            const isFailed =
              resource.status === 3 || resource.status === "Failed";
            const isProvisioning =
              resource.status === 1 || resource.status === "Provisioning";

            return (
              <Card
                key={resource.id}
                className={`transition-shadow ${
                  isFailed
                    ? "border-red-200 bg-red-50 hover:shadow-md hover:border-red-300"
                    : isProvisioning
                    ? "border-blue-200 bg-blue-50 hover:shadow-md hover:border-blue-300"
                    : "hover:shadow-md"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{resource.name}</span>
                        {isFailed && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{resource.type}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(resource.status)}>
                      {statusText}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Region:</span>{" "}
                      {resource.region}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Resource Group:</span>{" "}
                      {resource.resourceGroup}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Monthly Cost:</span>{" "}
                      <span className="font-semibold text-green-600">
                        ${resource.cost}/month
                      </span>
                    </div>

                    {isFailed && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                        <p className="font-medium">⚠️ Provisioning Failed</p>
                        <p className="text-xs mt-1">
                          Check Azure portal for details or try reprovisioning.
                        </p>
                      </div>
                    )}

                    {isProvisioning && (
                      <div className="mt-3 p-2 bg-blue-100 border border-blue-200 rounded text-sm text-blue-700">
                        <p className="font-medium">
                          🔄 Provisioning in Progress
                        </p>
                        <p className="text-xs mt-1">
                          This may take several minutes to complete.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link
                        href={`/projects/${projectId}/resources/${resource.id}`}
                      >
                        View Details
                      </Link>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfigure(resource)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Configure {resource.name}</DialogTitle>
                          <DialogDescription>
                            Manage settings and configuration for this{" "}
                            {resource.type} resource
                          </DialogDescription>
                        </DialogHeader>
                        {renderConfigurationContent(resource)}
                      </DialogContent>
                    </Dialog>

                    {isFailed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}`}>← Back to Project</Link>
        </Button>
      </div>
    </div>
  );
}
