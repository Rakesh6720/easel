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
  RefreshCw,
  DollarSign,
  Activity,
  Cpu,
  HardDrive,
  Network,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getResourceTypeIcon,
} from "@/lib/utils";
import {
  mockAzureMetricsResponse,
  getCpuMetricData,
  getMemoryMetricData,
  getRequestsMetricData,
  getResponseTimeMetricData,
  getErrorsMetricData,
  getBandwidthMetricData,
  formatBytes,
  formatResponseTime,
} from "@/lib/mock-azure-metrics";
import {
  getResourceData,
  getResourceAlerts,
  getResourceLogs,
  getCurrentMetrics,
} from "@/lib/mock-resource-data";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function ResourceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { id: projectId, resourceId } = params;
  const [activeTab, setActiveTab] = useState<
    "overview" | "metrics" | "logs" | "settings"
  >("overview");

  // Check for tab parameter in URL and set initial tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["overview", "metrics", "logs", "settings"].includes(tabParam)
    ) {
      setActiveTab(tabParam as "overview" | "metrics" | "logs" | "settings");
    }
  }, [searchParams]);

  // Get dynamic data based on resourceId using the imported functions
  const resourceIdNum = parseInt(resourceId as string);
  const mockResource = getResourceData(resourceIdNum);
  const mockAlerts = getResourceAlerts(resourceIdNum);
  const mockLogs = getResourceLogs(resourceIdNum);
  const mockMetrics = getCurrentMetrics(resourceIdNum);

  // Fallback if no resource found
  if (!mockResource) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Resource Not Found</h2>
            <p className="text-muted-foreground">
              The requested resource could not be found.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/projects/${projectId}`}>Back to Project</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResourceAction = (action: string) => {
    console.log(`Performing ${action} on resource ${resourceId}`);
    // This would call the actual Azure management API
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "metrics", label: "Metrics", icon: TrendingUp },
    { id: "logs", label: "Logs", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-azure-blue">
          Projects
        </Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-azure-blue">
          Project Details
        </Link>
        <span>/</span>
        <span>{mockResource.name}</span>
      </div>

      {/* Resource Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 azure-gradient rounded-xl flex items-center justify-center text-3xl">
            {getResourceTypeIcon(mockResource.type)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mockResource.name}
            </h1>
            <p className="text-muted-foreground mb-3">{mockResource.type}</p>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(mockResource.status)}>
                {mockResource.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {mockResource.location}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(mockResource.cost)}/month
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleResourceAction("restart")}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleResourceAction("scale")}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Scale
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://portal.azure.com/#@/resource${mockResource.azureResourceId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Azure Portal
            </a>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleResourceAction("delete")}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-azure-blue text-azure-blue"
                    : "border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      CPU Usage
                    </p>
                    <p className="text-2xl font-bold">
                      {mockMetrics?.cpu?.current || 0}%
                    </p>
                  </div>
                  <Cpu className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Memory Usage
                    </p>
                    <p className="text-2xl font-bold">
                      {mockMetrics?.memory?.current || 0}%
                    </p>
                  </div>
                  <HardDrive className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Requests/min
                    </p>
                    <p className="text-2xl font-bold">
                      {mockMetrics?.requests?.current || 0}
                    </p>
                  </div>
                  <Network className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Response Time
                    </p>
                    <p className="text-2xl font-bold">
                      {mockMetrics?.responseTime?.current || 0}ms
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resource Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {mockResource.type === "microsoft.web/sites" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SKU</span>
                        <span>{mockResource.configuration.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Runtime</span>
                        <span>{mockResource.configuration.runtime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform</span>
                        <span>{mockResource.configuration.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Instances</span>
                        <span>{mockResource.configuration.instances}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Auto Scale
                        </span>
                        <span>
                          {mockResource.configuration.autoScale
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </>
                  )}
                  {mockResource.type === "microsoft.sql/servers/databases" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tier</span>
                        <span>{mockResource.configuration.tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Objective
                        </span>
                        <span>
                          {mockResource.configuration.serviceObjective}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Size</span>
                        <span>{mockResource.configuration.maxSizeGB} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Collation</span>
                        <span>{mockResource.configuration.collation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Backup Retention
                        </span>
                        <span>
                          {mockResource.configuration.backupRetentionDays} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Geo Redundant Backup
                        </span>
                        <span>
                          {mockResource.configuration.geoRedundantBackup
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </>
                  )}
                  {mockResource.type ===
                    "microsoft.storage/storageaccounts" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Account Type
                        </span>
                        <span>{mockResource.configuration.accountType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Access Tier
                        </span>
                        <span>{mockResource.configuration.accessTier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          HTTPS Only
                        </span>
                        <span>
                          {mockResource.configuration.httpsOnly
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Min TLS Version
                        </span>
                        <span>
                          {mockResource.configuration.minimumTlsVersion}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Blob Public Access
                        </span>
                        <span>
                          {mockResource.configuration.blobPublicAccess
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </>
                  )}
                  {mockResource.type === "microsoft.insights/components" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Application Type
                        </span>
                        <span>
                          {mockResource.configuration.applicationType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Flow Type</span>
                        <span>{mockResource.configuration.flowType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Request Source
                        </span>
                        <span>{mockResource.configuration.requestSource}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retention</span>
                        <span>
                          {mockResource.configuration.retentionDays} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Daily Data Cap
                        </span>
                        <span>
                          {mockResource.configuration.dailyDataCapGB} GB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sampling</span>
                        <span>
                          {mockResource.configuration.samplingPercentage}%
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Resource Group
                    </span>
                    <span>{mockResource.resourceGroup}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3">
                      {alert.severity === "Warning" ? (
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(alert.triggeredAt)}
                        </p>
                      </div>
                      <Badge
                        variant={alert.resolved ? "secondary" : "destructive"}
                      >
                        {alert.resolved ? "Resolved" : "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="space-y-6">
          {/* Performance Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg CPU Usage
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        getCpuMetricData().reduce(
                          (sum, d) => sum + (d.average || 0),
                          0
                        ) / getCpuMetricData().length
                      )}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last 24 hours
                    </p>
                  </div>
                  <Cpu className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg Memory Usage
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        getMemoryMetricData().reduce(
                          (sum, d) => sum + (d.average || 0),
                          0
                        ) / getMemoryMetricData().length
                      )}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last 24 hours
                    </p>
                  </div>
                  <HardDrive className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Requests
                    </p>
                    <p className="text-2xl font-bold">
                      {getRequestsMetricData()
                        .reduce((sum, d) => sum + (d.total || 0), 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last 24 hours
                    </p>
                  </div>
                  <Network className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg Response Time
                    </p>
                    <p className="text-2xl font-bold">
                      {formatResponseTime(
                        getResponseTimeMetricData().reduce(
                          (sum, d) => sum + (d.average || 0),
                          0
                        ) / getResponseTimeMetricData().length
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last 24 hours
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* CPU Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
                <CardDescription>Percentage over last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 flex items-end justify-between bg-muted/20 p-4 rounded">
                    {getCpuMetricData()
                      .slice(-12)
                      .map((dataPoint, index) => {
                        const height = ((dataPoint.average || 0) / 100) * 200;
                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <div
                              className="bg-azure-blue rounded-t w-4 transition-all"
                              style={{ height: `${height}px` }}
                            />
                            <span className="text-xs text-muted-foreground mt-2">
                              {new Date(dataPoint.timeStamp).getHours()}:00
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Peak:{" "}
                      {Math.max(
                        ...getCpuMetricData().map((d) => d.average || 0)
                      ).toFixed(1)}
                      %
                    </span>
                    <span>
                      Low:{" "}
                      {Math.min(
                        ...getCpuMetricData().map((d) => d.average || 0)
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Percentage over last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 flex items-end justify-between bg-muted/20 p-4 rounded">
                    {getMemoryMetricData()
                      .slice(-12)
                      .map((dataPoint, index) => {
                        const height = ((dataPoint.average || 0) / 100) * 200;
                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <div
                              className="bg-orange-400 rounded-t w-4 transition-all"
                              style={{ height: `${height}px` }}
                            />
                            <span className="text-xs text-muted-foreground mt-2">
                              {new Date(dataPoint.timeStamp).getHours()}:00
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Peak:{" "}
                      {Math.max(
                        ...getMemoryMetricData().map((d) => d.average || 0)
                      ).toFixed(1)}
                      %
                    </span>
                    <span>
                      Low:{" "}
                      {Math.min(
                        ...getMemoryMetricData().map((d) => d.average || 0)
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
                <CardDescription>
                  Requests per hour over last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 flex items-end justify-between bg-muted/20 p-4 rounded">
                    {getRequestsMetricData()
                      .slice(-12)
                      .map((dataPoint, index) => {
                        const maxRequests = Math.max(
                          ...getRequestsMetricData().map((d) => d.total || 0)
                        );
                        const height =
                          ((dataPoint.total || 0) / maxRequests) * 200;
                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <div
                              className="bg-green-500 rounded-t w-4 transition-all"
                              style={{ height: `${height}px` }}
                            />
                            <span className="text-xs text-muted-foreground mt-2">
                              {new Date(dataPoint.timeStamp).getHours()}:00
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Peak:{" "}
                      {Math.max(
                        ...getRequestsMetricData().map((d) => d.total || 0)
                      ).toLocaleString()}
                    </span>
                    <span>
                      Low:{" "}
                      {Math.min(
                        ...getRequestsMetricData().map((d) => d.total || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <CardDescription>
                  Average response time over last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 flex items-end justify-between bg-muted/20 p-4 rounded">
                    {getResponseTimeMetricData()
                      .slice(-12)
                      .map((dataPoint, index) => {
                        const maxResponseTime = Math.max(
                          ...getResponseTimeMetricData().map(
                            (d) => d.average || 0
                          )
                        );
                        const height =
                          ((dataPoint.average || 0) / maxResponseTime) * 200;
                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <div
                              className="bg-purple-500 rounded-t w-4 transition-all"
                              style={{ height: `${height}px` }}
                            />
                            <span className="text-xs text-muted-foreground mt-2">
                              {new Date(dataPoint.timeStamp).getHours()}:00
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Peak:{" "}
                      {formatResponseTime(
                        Math.max(
                          ...getResponseTimeMetricData().map(
                            (d) => d.average || 0
                          )
                        )
                      )}
                    </span>
                    <span>
                      Low:{" "}
                      {formatResponseTime(
                        Math.min(
                          ...getResponseTimeMetricData().map(
                            (d) => d.average || 0
                          )
                        )
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Rates and Bandwidth */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Error Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Error Rates (4xx)</CardTitle>
                <CardDescription>
                  HTTP 4xx errors over last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {getErrorsMetricData().reduce(
                          (sum, d) => sum + (d.total || 0),
                          0
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total 4xx errors
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Error Rate:{" "}
                      {(
                        (getErrorsMetricData().reduce(
                          (sum, d) => sum + (d.total || 0),
                          0
                        ) /
                          getRequestsMetricData().reduce(
                            (sum, d) => sum + (d.total || 0),
                            0
                          )) *
                        100
                      ).toFixed(2)}
                      %
                    </p>
                    <p>
                      Peak Hour:{" "}
                      {Math.max(
                        ...getErrorsMetricData().map((d) => d.total || 0)
                      )}{" "}
                      errors
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bandwidth Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Bandwidth Usage</CardTitle>
                <CardDescription>
                  Data transfer over last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Data In
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatBytes(
                          getBandwidthMetricData().dataIn.reduce(
                            (sum, d) => sum + (d.total || 0),
                            0
                          )
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Data Out
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {formatBytes(
                          getBandwidthMetricData().dataOut.reduce(
                            (sum, d) => sum + (d.total || 0),
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Total Transfer:{" "}
                      {formatBytes(
                        getBandwidthMetricData().dataIn.reduce(
                          (sum, d) => sum + (d.total || 0),
                          0
                        ) +
                          getBandwidthMetricData().dataOut.reduce(
                            (sum, d) => sum + (d.total || 0),
                            0
                          )
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Raw Metrics Data */}
          <Card>
            <CardHeader>
              <CardTitle>Azure Monitor Data</CardTitle>
              <CardDescription>
                Raw metrics from Azure Monitor API (JSON format)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 p-4 rounded text-xs font-mono overflow-auto max-h-96">
                <pre>{JSON.stringify(mockAzureMetricsResponse, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Logs</CardTitle>
              <CardDescription>
                Recent log entries from your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockLogs.map((log, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            log.level === "Error"
                              ? "destructive"
                              : log.level === "Warning"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {log.level}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.source}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{log.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Settings</CardTitle>
              <CardDescription>
                Manage resource configuration and scaling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4" />
                <p>Resource configuration settings would be displayed here</p>
                <p className="text-sm">
                  Scaling, environment variables, connection strings, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
