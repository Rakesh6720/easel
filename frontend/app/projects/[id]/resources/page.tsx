"use client";

import { useState } from "react";
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
import { Settings, ExternalLink } from "lucide-react";
import { getResourcesForProject } from "@/lib/mock-resource-data";

export default function ProjectResourcesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // Get resources for this project
  const resources = getResourcesForProject(parseInt(projectId, 10));

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

      {resources.length === 0 ? (
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
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <CardDescription>{resource.type}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      resource.status === "running"
                        ? "default"
                        : resource.status === "stopped"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {resource.status}
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
                </div>
              </CardContent>
            </Card>
          ))}
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
