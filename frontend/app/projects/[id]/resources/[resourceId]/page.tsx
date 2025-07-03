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
  getStatusText,
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
import { projectsService, type AzureResource } from "@/lib/projects";
import { azureService } from "@/lib/azure";
import { isTestUser } from "@/lib/test-user";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function ResourceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { id: projectId, resourceId } = params;
  const [activeTab, setActiveTab] = useState<
    "overview" | "metrics" | "logs" | "settings"
  >("overview");

  // State for resource data
  const [resource, setResource] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [azureMetrics, setAzureMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

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

  // Fetch resource data
  useEffect(() => {
    const fetchResourceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const resourceIdNum = parseInt(resourceId as string);

        if (isTestUser()) {
          // Use mock data for test user
          const mockResource = getResourceData(resourceIdNum);
          const mockAlerts = getResourceAlerts(resourceIdNum);
          const mockLogs = getResourceLogs(resourceIdNum);
          const mockMetrics = getCurrentMetrics(resourceIdNum);

          if (!mockResource) {
            setError("Resource not found in mock data");
            return;
          }

          setResource(mockResource);
          setAlerts(mockAlerts);
          setLogs(mockLogs);
          setMetrics(mockMetrics);
        } else {
          // Fetch real data for other users
          const project = await projectsService.getProject(
            parseInt(projectId as string)
          );
          const foundResource = project?.resources?.find(
            (r) => r.id === resourceIdNum
          );

          if (!foundResource) {
            setError("Resource not found");
            return;
          }

          // Convert API resource to expected format
          const formattedResource = {
            id: foundResource.id,
            name: foundResource.name,
            type: foundResource.resourceType,
            status: foundResource.status,
            location: foundResource.location,
            region: foundResource.location,
            cost: foundResource.estimatedMonthlyCost || 0,
            lastUpdated: foundResource.provisionedAt || foundResource.createdAt,
            createdAt: foundResource.createdAt,
            resourceGroup: foundResource.resourceGroupName || "Unknown",
            subscription: foundResource.azureResourceId ? foundResource.azureResourceId.split('/')[2] : "Unknown",
            azureResourceId: foundResource.azureResourceId || "",
            configuration: foundResource.configuration || {},
          };

          setResource(formattedResource);
          
          // For real users, try to fetch actual Azure metrics
          try {
            const realMetrics = await azureService.getResourceMetrics(resourceIdNum);
            setAzureMetrics(realMetrics);
            
            // Convert Azure metrics to the format expected by the UI
            const formattedMetrics = {
              cpu: { 
                current: realMetrics.CpuPercentage?.[0]?.Average || 0, 
                average: realMetrics.CpuPercentage?.reduce((sum: number, dp: any) => sum + (dp.Average || 0), 0) / (realMetrics.CpuPercentage?.length || 1) || 0,
                max: Math.max(...(realMetrics.CpuPercentage?.map((dp: any) => dp.Maximum || 0) || [0]))
              },
              memory: { 
                current: realMetrics.MemoryPercentage?.[0]?.Average || 0,
                average: realMetrics.MemoryPercentage?.reduce((sum: number, dp: any) => sum + (dp.Average || 0), 0) / (realMetrics.MemoryPercentage?.length || 1) || 0,
                max: Math.max(...(realMetrics.MemoryPercentage?.map((dp: any) => dp.Maximum || 0) || [0]))
              },
              requests: { 
                current: realMetrics.Requests?.[0]?.Total || 0, 
                total: realMetrics.Requests?.reduce((sum: number, dp: any) => sum + (dp.Total || 0), 0) || 0,
                errorsToday: realMetrics.Http4xx?.reduce((sum: number, dp: any) => sum + (dp.Total || 0), 0) || 0
              },
              responseTime: { 
                current: realMetrics.AverageResponseTime?.[0]?.Average || 0,
                average: realMetrics.AverageResponseTime?.reduce((sum: number, dp: any) => sum + (dp.Average || 0), 0) / (realMetrics.AverageResponseTime?.length || 1) || 0,
                p95: Math.max(...(realMetrics.AverageResponseTime?.map((dp: any) => dp.Maximum || 0) || [0]))
              },
            };
            setMetrics(formattedMetrics);
          } catch (metricsError) {
            console.warn("Could not fetch Azure metrics, using placeholder data:", metricsError);
            // Fallback to placeholder metrics
            setMetrics({
              cpu: { current: 0, average: 0, max: 0 },
              memory: { current: 0, average: 0, max: 0 },
              requests: { current: 0, total: 0, errorsToday: 0 },
              responseTime: { current: 0, average: 0, p95: 0 },
            });
          }
          
          // For real data, we don't have alerts or logs yet
          setAlerts([]);
          setLogs([]);
        }
      } catch (err) {
        console.error("Error fetching resource data:", err);
        setError("Failed to load resource data");
      } finally {
        setLoading(false);
      }
    };

    fetchResourceData();
  }, [projectId, resourceId]);

  const handleResourceAction = (action: string) => {
    console.log(`Performing ${action} on resource ${resourceId}`);
    // This would call the actual Azure management API
  };

  const handleRetryResource = async () => {
    try {
      setRetrying(true);

      await projectsService.retryResource(
        parseInt(projectId as string),
        parseInt(resourceId as string)
      );

      // Refresh the resource data to show updated status
      const resourceIdNum = parseInt(resourceId as string);

      if (isTestUser()) {
        const mockResource = getResourceData(resourceIdNum);
        const mockAlerts = getResourceAlerts(resourceIdNum);
        const mockLogs = getResourceLogs(resourceIdNum);
        const mockMetrics = getCurrentMetrics(resourceIdNum);

        if (mockResource) {
          setResource(mockResource);
          setAlerts(mockAlerts);
          setLogs(mockLogs);
          setMetrics(mockMetrics);
        }
      } else {
        const project = await projectsService.getProject(
          parseInt(projectId as string)
        );
        const foundResource = project?.resources?.find(
          (r) => r.id === resourceIdNum
        );

        if (foundResource) {
          const formattedResource = {
            id: foundResource.id,
            name: foundResource.name,
            type: foundResource.resourceType,
            status: foundResource.status,
            location: foundResource.location,
            region: foundResource.location,
            cost: foundResource.estimatedMonthlyCost || 0,
            lastUpdated: foundResource.provisionedAt || foundResource.createdAt,
            createdAt: foundResource.createdAt,
            resourceGroup: "default-rg",
            subscription: "default-subscription",
            azureResourceId: "",
            configuration: foundResource.configuration || {},
          };
          setResource(formattedResource);
          setAlerts([]);
          setLogs([]);
          setMetrics({
            cpu: { current: 0, average: 0, max: 0 },
            memory: { current: 0, average: 0, max: 0 },
            requests: { current: 0, total: 0, errorsToday: 0 },
            responseTime: { current: 0, average: 0, p95: 0 },
          });
        }
      }
    } catch (err) {
      console.error("Error retrying resource:", err);
      setError("Failed to retry resource");
    } finally {
      setRetrying(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !resource) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Resource Not Found</h2>
            <p className="text-muted-foreground">
              {error || "The requested resource could not be found."}
            </p>
            <Button asChild className="mt-4">
              <Link href={`/projects/${projectId}`}>Back to Project</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <span>{resource.name}</span>
      </div>

      {/* Resource Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 azure-gradient rounded-xl flex items-center justify-center text-3xl">
            {getResourceTypeIcon(resource.type)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {resource.name}
            </h1>
            <p className="text-muted-foreground mb-3">{resource.type}</p>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(resource.status)}>
                {getStatusText(resource.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {resource.location}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(resource.cost)}/month
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
              href={`https://portal.azure.com/#@/resource${resource.azureResourceId}`}
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
                      {metrics?.cpu?.current || 0}%
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
                      {metrics?.memory?.current || 0}%
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
                      {metrics?.requests?.current || 0}
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
                      {Math.round(metrics?.responseTime?.current || 0)}ms
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
                  {resource.type === "microsoft.web/sites" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SKU</span>
                        <span>{resource.configuration.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Runtime</span>
                        <span>{resource.configuration.runtime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform</span>
                        <span>{resource.configuration.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Instances</span>
                        <span>{resource.configuration.instances}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Auto Scale
                        </span>
                        <span>
                          {resource.configuration.autoScale
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </>
                  )}
                  {resource.type === "microsoft.sql/servers/databases" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tier</span>
                        <span>{resource.configuration.tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Objective
                        </span>
                        <span>{resource.configuration.serviceObjective}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Size</span>
                        <span>{resource.configuration.maxSizeGB} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Collation</span>
                        <span>{resource.configuration.collation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Backup Retention
                        </span>
                        <span>
                          {resource.configuration.backupRetentionDays} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Geo Redundant Backup
                        </span>
                        <span>
                          {resource.configuration.geoRedundantBackup
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </>
                  )}
                  {resource.type === "microsoft.storage/storageaccounts" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Account Type
                        </span>
                        <span>{resource.configuration.accountType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Access Tier
                        </span>
                        <span>{resource.configuration.accessTier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          HTTPS Only
                        </span>
                        <span>
                          {resource.configuration.httpsOnly
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Min TLS Version
                        </span>
                        <span>{resource.configuration.minimumTlsVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Blob Public Access
                        </span>
                        <span>
                          {resource.configuration.blobPublicAccess
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </>
                  )}
                  {resource.type === "microsoft.insights/components" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Application Type
                        </span>
                        <span>{resource.configuration.applicationType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Flow Type</span>
                        <span>{resource.configuration.flowType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Request Source
                        </span>
                        <span>{resource.configuration.requestSource}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retention</span>
                        <span>{resource.configuration.retentionDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Daily Data Cap
                        </span>
                        <span>{resource.configuration.dailyDataCapGB} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sampling</span>
                        <span>
                          {resource.configuration.samplingPercentage}%
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Resource Group
                    </span>
                    <span>{resource.resourceGroup}</span>
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
                  {alerts.map((alert) => (
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
          {/* Performance Metrics Overview - Real data for authenticated users, mock data for test users */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg CPU Usage
                    </p>
                    <p className="text-2xl font-bold">
                      {isTestUser() ? Math.round(
                        getCpuMetricData().reduce(
                          (sum, d) => sum + (d.average || 0),
                          0
                        ) / getCpuMetricData().length
                      ) : Math.round(metrics?.cpu?.average || 0)}
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
                      {isTestUser() ? Math.round(
                        getMemoryMetricData().reduce(
                          (sum, d) => sum + (d.average || 0),
                          0
                        ) / getMemoryMetricData().length
                      ) : Math.round(metrics?.memory?.average || 0)}
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
                      {isTestUser() ? getRequestsMetricData()
                        .reduce((sum, d) => sum + (d.total || 0), 0)
                        .toLocaleString() : (metrics?.requests?.total || 0).toLocaleString()}
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
                      {isTestUser() ? formatResponseTime(
                        getResponseTimeMetricData().reduce(
                          (sum, d) => sum + (d.average || 0),
                          0
                        ) / getResponseTimeMetricData().length
                      ) : `${Math.round(metrics?.responseTime?.average || 0)}ms`}
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
                    {(() => {
                      const cpuData = isTestUser() 
                        ? getCpuMetricData() 
                        : (azureMetrics?.CpuPercentage || azureMetrics?.["cpu_percent"] || []);
                      return cpuData.slice(-12).map((dataPoint, index) => {
                        const value = isTestUser() ? dataPoint.average : (dataPoint.Average || 0);
                        const height = ((value || 0) / 100) * 200;
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
                              {isTestUser() 
                                ? new Date(dataPoint.timeStamp).getHours() + ":00"
                                : new Date(dataPoint.TimeStamp).getHours() + ":00"}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Peak:{" "}
                      {(() => {
                        const cpuData = isTestUser() 
                          ? getCpuMetricData() 
                          : (azureMetrics?.CpuPercentage || azureMetrics?.["cpu_percent"] || []);
                        const values = cpuData.map(d => isTestUser() ? (d.average || 0) : (d.Average || 0));
                        return Math.max(...values, 0).toFixed(1);
                      })()}
                      %
                    </span>
                    <span>
                      Low:{" "}
                      {(() => {
                        const cpuData = isTestUser() 
                          ? getCpuMetricData() 
                          : (azureMetrics?.CpuPercentage || azureMetrics?.["cpu_percent"] || []);
                        const values = cpuData.map(d => isTestUser() ? (d.average || 0) : (d.Average || 0));
                        return Math.min(...values, 0).toFixed(1);
                      })()}
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
                    {(() => {
                      const memoryData = isTestUser() 
                        ? getMemoryMetricData() 
                        : (azureMetrics?.MemoryPercentage || azureMetrics?.["physical_data_read_percent"] || []);
                      return memoryData.slice(-12).map((dataPoint, index) => {
                        const value = isTestUser() ? dataPoint.average : (dataPoint.Average || 0);
                        const height = ((value || 0) / 100) * 200;
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
                              {isTestUser() 
                                ? new Date(dataPoint.timeStamp).getHours() + ":00"
                                : new Date(dataPoint.TimeStamp).getHours() + ":00"}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Peak:{" "}
                      {(() => {
                        const memoryData = isTestUser() 
                          ? getMemoryMetricData() 
                          : (azureMetrics?.MemoryPercentage || azureMetrics?.["physical_data_read_percent"] || []);
                        const values = memoryData.map(d => isTestUser() ? (d.average || 0) : (d.Average || 0));
                        return Math.max(...values, 0).toFixed(1);
                      })()}
                      %
                    </span>
                    <span>
                      Low:{" "}
                      {(() => {
                        const memoryData = isTestUser() 
                          ? getMemoryMetricData() 
                          : (azureMetrics?.MemoryPercentage || azureMetrics?.["physical_data_read_percent"] || []);
                        const values = memoryData.map(d => isTestUser() ? (d.average || 0) : (d.Average || 0));
                        return Math.min(...values, 0).toFixed(1);
                      })()}
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
                    {(() => {
                      const requestsData = isTestUser() 
                        ? getRequestsMetricData() 
                        : (azureMetrics?.Requests || azureMetrics?.Transactions || []);
                      const allValues = requestsData.map(d => isTestUser() ? (d.total || 0) : (d.Total || 0));
                      const maxRequests = Math.max(...allValues, 1);
                      return requestsData.slice(-12).map((dataPoint, index) => {
                        const value = isTestUser() ? dataPoint.total : (dataPoint.Total || 0);
                        const height = ((value || 0) / maxRequests) * 200;
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
                              {isTestUser() 
                                ? new Date(dataPoint.timeStamp).getHours() + ":00"
                                : new Date(dataPoint.TimeStamp).getHours() + ":00"}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Peak:{" "}
                      {(() => {
                        const requestsData = isTestUser() 
                          ? getRequestsMetricData() 
                          : (azureMetrics?.Requests || azureMetrics?.Transactions || []);
                        const values = requestsData.map(d => isTestUser() ? (d.total || 0) : (d.Total || 0));
                        return Math.max(...values, 0).toLocaleString();
                      })()}
                    </span>
                    <span>
                      Low:{" "}
                      {(() => {
                        const requestsData = isTestUser() 
                          ? getRequestsMetricData() 
                          : (azureMetrics?.Requests || azureMetrics?.Transactions || []);
                        const values = requestsData.map(d => isTestUser() ? (d.total || 0) : (d.Total || 0));
                        return Math.min(...values, 0).toLocaleString();
                      })()}
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
                    {(() => {
                      const responseTimeData = isTestUser() 
                        ? getResponseTimeMetricData() 
                        : (azureMetrics?.AverageResponseTime || azureMetrics?.SuccessServerLatency || []);
                      const allValues = responseTimeData.map(d => isTestUser() ? (d.average || 0) : (d.Average || 0));
                      const maxResponseTime = Math.max(...allValues, 1);
                      return responseTimeData.slice(-12).map((dataPoint, index) => {
                        const value = isTestUser() ? dataPoint.average : (dataPoint.Average || 0);
                        const height = ((value || 0) / maxResponseTime) * 200;
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
                              {isTestUser() 
                                ? new Date(dataPoint.timeStamp).getHours() + ":00"
                                : new Date(dataPoint.TimeStamp).getHours() + ":00"}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Peak:{" "}
                      {(() => {
                        const responseTimeData = isTestUser() 
                          ? getResponseTimeMetricData() 
                          : (azureMetrics?.AverageResponseTime || azureMetrics?.SuccessServerLatency || []);
                        const values = responseTimeData.map(d => isTestUser() ? (d.average || 0) : (d.Average || 0));
                        const maxValue = Math.max(...values, 0);
                        return isTestUser() ? formatResponseTime(maxValue) : `${Math.round(maxValue)}ms`;
                      })()}
                    </span>
                    <span>
                      Low:{" "}
                      {(() => {
                        const responseTimeData = isTestUser() 
                          ? getResponseTimeMetricData() 
                          : (azureMetrics?.AverageResponseTime || azureMetrics?.SuccessServerLatency || []);
                        const values = responseTimeData.map(d => isTestUser() ? (d.average || 0) : (d.Average || 0));
                        const minValue = Math.min(...values, 0);
                        return isTestUser() ? formatResponseTime(minValue) : `${Math.round(minValue)}ms`;
                      })()}
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
                        {(() => {
                          const errorData = isTestUser() 
                            ? getErrorsMetricData() 
                            : (azureMetrics?.Http4xx || []);
                          return errorData.reduce((sum, d) => sum + (isTestUser() ? (d.total || 0) : (d.Total || 0)), 0);
                        })()}
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
                      {(() => {
                        const errorData = isTestUser() ? getErrorsMetricData() : (azureMetrics?.Http4xx || []);
                        const requestData = isTestUser() ? getRequestsMetricData() : (azureMetrics?.Requests || azureMetrics?.Transactions || []);
                        const errorTotal = errorData.reduce((sum, d) => sum + (isTestUser() ? (d.total || 0) : (d.Total || 0)), 0);
                        const requestTotal = requestData.reduce((sum, d) => sum + (isTestUser() ? (d.total || 0) : (d.Total || 0)), 0);
                        return requestTotal > 0 ? ((errorTotal / requestTotal) * 100).toFixed(2) : "0.00";
                      })()}
                      %
                    </p>
                    <p>
                      Peak Hour:{" "}
                      {(() => {
                        const errorData = isTestUser() ? getErrorsMetricData() : (azureMetrics?.Http4xx || []);
                        const values = errorData.map(d => isTestUser() ? (d.total || 0) : (d.Total || 0));
                        return Math.max(...values, 0);
                      })()}{" "}
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
                        {(() => {
                          if (isTestUser()) {
                            return formatBytes(getBandwidthMetricData().dataIn.reduce((sum, d) => sum + (d.total || 0), 0));
                          } else {
                            const ingressData = azureMetrics?.Ingress || [];
                            const total = ingressData.reduce((sum, d) => sum + (d.Total || 0), 0);
                            return formatBytes(total);
                          }
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Data Out
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {(() => {
                          if (isTestUser()) {
                            return formatBytes(getBandwidthMetricData().dataOut.reduce((sum, d) => sum + (d.total || 0), 0));
                          } else {
                            const egressData = azureMetrics?.Egress || [];
                            const total = egressData.reduce((sum, d) => sum + (d.Total || 0), 0);
                            return formatBytes(total);
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Total Transfer:{" "}
                      {(() => {
                        if (isTestUser()) {
                          return formatBytes(
                            getBandwidthMetricData().dataIn.reduce((sum, d) => sum + (d.total || 0), 0) +
                            getBandwidthMetricData().dataOut.reduce((sum, d) => sum + (d.total || 0), 0)
                          );
                        } else {
                          const ingressData = azureMetrics?.Ingress || [];
                          const egressData = azureMetrics?.Egress || [];
                          const inTotal = ingressData.reduce((sum, d) => sum + (d.Total || 0), 0);
                          const outTotal = egressData.reduce((sum, d) => sum + (d.Total || 0), 0);
                          return formatBytes(inTotal + outTotal);
                        }
                      })()}
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
                <pre>{JSON.stringify(isTestUser() ? mockAzureMetricsResponse : azureMetrics, null, 2)}</pre>
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
                {isTestUser() ? "Recent log entries from your application" : "Real-time application logs"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isTestUser() ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Logs Coming Soon</p>
                  <p>Azure Log Analytics integration is in development.</p>
                  <p className="text-sm">Application logs, error tracking, and diagnostics will be available here.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <a
                      href={`https://portal.azure.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View in Azure Portal
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log, index) => (
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
              )}
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
