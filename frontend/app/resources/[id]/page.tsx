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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
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
  ExternalLink,
  Activity,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Trash2,
  Edit,
  RefreshCw,
  DollarSign,
  Clock,
  Server,
  BarChart3,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getResourceTypeIcon,
} from "@/lib/utils";
import { allMockResourcesData, ResourceData } from "@/lib/mock-resource-data";

export default function ResourceDetailsPage() {
  const params = useParams();
  const resourceId = parseInt(params.id as string, 10);
  const [activeTab, setActiveTab] = useState("overview");

  // Get the specific resource
  const resource: ResourceData | undefined = allMockResourcesData[resourceId];

  if (!resource) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Resource Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The resource you're looking for doesn't exist or may have been
            deleted.
          </p>
          <Button asChild>
            <Link href="/resources">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Resources
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const mockMetrics = {
    cpu: 65,
    memory: 72,
    storage: 45,
    network: 28,
  };

  const mockAlerts = [
    {
      id: 1,
      severity: "warning" as const,
      message: "CPU usage above 80% for 10 minutes",
      timestamp: "2024-01-20T14:30:00Z",
    },
    {
      id: 2,
      severity: "info" as const,
      message: "Scheduled maintenance completed successfully",
      timestamp: "2024-01-20T10:15:00Z",
    },
  ];

  const mockLogs = [
    {
      timestamp: "2024-01-20T15:45:00Z",
      level: "info" as const,
      message: "Application started successfully",
    },
    {
      timestamp: "2024-01-20T15:30:00Z",
      level: "warning" as const,
      message: "High memory usage detected",
    },
    {
      timestamp: "2024-01-20T15:15:00Z",
      level: "error" as const,
      message: "Connection timeout to database",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-azure-blue flex items-center"
        >
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/resources" className="hover:text-azure-blue">
          Resources
        </Link>
        <span>/</span>
        <span>{resource.name}</span>
      </div>

      {/* Resource Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/resources">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="text-3xl">{getResourceTypeIcon(resource.type)}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {resource.name}
            </h1>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span>{resource.type}</span>
              <span>•</span>
              <span>{resource.region}</span>
              <span>•</span>
              <Badge className={getStatusColor(resource.status)}>
                {resource.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://portal.azure.com/#@/resource${resource.azureResourceId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Azure Portal
            </a>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Cost
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(resource.cost)}
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
                  Created
                </p>
                <p className="text-sm font-bold">
                  {formatDate(resource.createdAt)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Health
                </p>
                <p className="text-2xl font-bold text-green-600">Healthy</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Current resource configuration and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Resource Group:</span>
                    <span className="text-sm text-muted-foreground">
                      {resource.resourceGroup}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Subscription:</span>
                    <span className="text-sm text-muted-foreground">
                      {resource.subscription}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm text-muted-foreground">
                      {resource.location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Resource ID:</span>
                    <span className="text-sm text-muted-foreground font-mono text-xs">
                      {resource.azureResourceId}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest events and changes for this resource
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Resource started successfully</p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Configuration updated</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Scheduled maintenance</p>
                      <p className="text-xs text-muted-foreground">
                        3 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(mockMetrics).map(([metric, value]) => (
              <Card key={metric}>
                <CardHeader>
                  <CardTitle className="capitalize">{metric} Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{value}%</span>
                      <BarChart3 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="azure-gradient h-2 rounded-full transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Recent log entries for this resource
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 border rounded"
                  >
                    <Badge
                      variant={
                        log.level === "error" ? "destructive" : "secondary"
                      }
                    >
                      {log.level}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Current alerts and notifications for this resource
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start space-x-3 p-3 border rounded"
                  >
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        alert.severity === "warning"
                          ? "text-yellow-500"
                          : "text-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Actions</CardTitle>
              <CardDescription>
                Manage and configure this resource
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-16 justify-start">
                  <Play className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Start Resource</div>
                    <div className="text-xs text-muted-foreground">
                      Start the resource if it's stopped
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-16 justify-start">
                  <Pause className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Stop Resource</div>
                    <div className="text-xs text-muted-foreground">
                      Gracefully stop the resource
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-16 justify-start">
                  <Edit className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Edit Configuration</div>
                    <div className="text-xs text-muted-foreground">
                      Modify resource settings
                    </div>
                  </div>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-16 justify-start border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Delete Resource</div>
                        <div className="text-xs text-muted-foreground">
                          Permanently delete this resource
                        </div>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Resource</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete "{resource.name}"? This
                        action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive">Delete</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
