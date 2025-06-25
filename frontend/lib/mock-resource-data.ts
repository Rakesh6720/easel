// Dynamic resource data based on resource type and ID
// This provides specific data for each Azure resource type

export interface ResourceData {
  id: number;
  name: string;
  type: string;
  status: string;
  location: string;
  region: string; // Add region property for the resources page
  cost: number;
  lastUpdated: string;
  createdAt: string; // Add createdAt property for the resources page
  resourceGroup: string;
  subscription: string;
  azureResourceId: string;
  configuration: Record<string, any>;
}

export interface ResourceAlert {
  id: number;
  severity: "Critical" | "Warning" | "Info";
  message: string;
  triggeredAt: string;
  resolved: boolean;
}

export interface ResourceLog {
  timestamp: string;
  level: "Error" | "Warning" | "Info" | "Debug";
  message: string;
  source: string;
}

// Resource data by ID
export const mockResourcesData: Record<number, ResourceData> = {
  1: {
    id: 1,
    name: "ecommerce-app-service",
    type: "microsoft.web/sites",
    status: "running",
    location: "East US",
    region: "East US",
    cost: 156.32,
    lastUpdated: "2024-01-20T14:22:00Z",
    createdAt: "2024-01-15T10:30:00Z",
    resourceGroup: "ecommerce-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-app-service",
    configuration: {
      sku: "S1",
      runtime: ".NET 8.0",
      platform: "Windows",
      instances: 1,
      autoScale: false,
      httpsOnly: true,
      ftpsState: "Disabled",
    },
  },
  2: {
    id: 2,
    name: "ecommerce-sql-db",
    type: "microsoft.sql/servers/databases",
    status: "running",
    location: "East US",
    region: "East US",
    cost: 198.45,
    lastUpdated: "2024-01-20T12:15:00Z",
    createdAt: "2024-01-15T11:00:00Z",
    resourceGroup: "ecommerce-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Sql/servers/ecommerce-sql-server/databases/ecommerce-sql-db",
    configuration: {
      tier: "Standard",
      serviceObjective: "S2",
      maxSizeBytes: 268435456000, // 250GB
      collation: "SQL_Latin1_General_CP1_CI_AS",
      backupRetentionDays: 7,
      geoReplication: false,
      transparentDataEncryption: true,
    },
  },
  3: {
    id: 3,
    name: "ecommerce-storage",
    type: "microsoft.storage/storageaccounts",
    status: "Active",
    location: "East US",
    region: "East US",
    cost: 45.21,
    lastUpdated: "2024-01-20T10:30:00Z",
    createdAt: "2024-01-15T12:00:00Z",
    resourceGroup: "ecommerce-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage",
    configuration: {
      accountType: "Standard_LRS",
      accessTier: "Hot",
      supportsHttpsTrafficOnly: true,
      minimumTlsVersion: "TLS1_2",
      allowBlobPublicAccess: false,
      networkAcls: "default",
    },
  },
  4: {
    id: 4,
    name: "ecommerce-insights",
    type: "microsoft.insights/components",
    status: "Active",
    location: "East US",
    region: "East US",
    cost: 25.34,
    lastUpdated: "2024-01-20T09:45:00Z",
    createdAt: "2024-01-15T13:30:00Z",
    resourceGroup: "ecommerce-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Insights/components/ecommerce-insights",
    configuration: {
      applicationType: "web",
      flowType: "Bluefield",
      requestSource: "rest",
      retentionInDays: 90,
      samplingPercentage: 100,
      disableIpMasking: false,
    },
  },
};

// Alerts by resource ID
export const mockResourceAlerts: Record<number, ResourceAlert[]> = {
  1: [
    // App Service
    {
      id: 1,
      severity: "Warning",
      message: "High CPU usage detected (>80%)",
      triggeredAt: "2024-01-20T13:45:00Z",
      resolved: false,
    },
    {
      id: 2,
      severity: "Info",
      message: "Successful deployment completed",
      triggeredAt: "2024-01-20T10:30:00Z",
      resolved: true,
    },
  ],
  2: [
    // SQL Database
    {
      id: 1,
      severity: "Critical",
      message: "Database DTU usage approaching limit (>90%)",
      triggeredAt: "2024-01-20T14:10:00Z",
      resolved: false,
    },
    {
      id: 2,
      severity: "Warning",
      message: "Long-running query detected (>5 minutes)",
      triggeredAt: "2024-01-20T12:30:00Z",
      resolved: true,
    },
    {
      id: 3,
      severity: "Info",
      message: "Automatic backup completed successfully",
      triggeredAt: "2024-01-20T02:00:00Z",
      resolved: true,
    },
  ],
  3: [
    // Storage Account
    {
      id: 1,
      severity: "Warning",
      message: "Storage capacity approaching 80% of limit",
      triggeredAt: "2024-01-20T11:20:00Z",
      resolved: false,
    },
    {
      id: 2,
      severity: "Info",
      message: "Blob container access policy updated",
      triggeredAt: "2024-01-20T09:15:00Z",
      resolved: true,
    },
  ],
  4: [
    // Application Insights
    {
      id: 1,
      severity: "Warning",
      message: "High exception rate detected (>5%)",
      triggeredAt: "2024-01-20T13:00:00Z",
      resolved: false,
    },
    {
      id: 2,
      severity: "Info",
      message: "Daily telemetry cap reached",
      triggeredAt: "2024-01-20T18:45:00Z",
      resolved: true,
    },
  ],
};

// Logs by resource ID
export const mockResourceLogs: Record<number, ResourceLog[]> = {
  1: [
    // App Service
    {
      timestamp: "2024-01-20T14:20:32Z",
      level: "Error",
      message: "Database connection timeout after 30 seconds",
      source: "Application",
    },
    {
      timestamp: "2024-01-20T14:18:15Z",
      level: "Info",
      message: "User authentication successful for user@example.com",
      source: "Authentication",
    },
    {
      timestamp: "2024-01-20T14:15:42Z",
      level: "Warning",
      message: "Memory usage approaching threshold (75%)",
      source: "System",
    },
  ],
  2: [
    // SQL Database
    {
      timestamp: "2024-01-20T14:22:18Z",
      level: "Error",
      message:
        "Query timeout: SELECT * FROM Products WHERE CategoryId IN (SELECT...)",
      source: "Query Engine",
    },
    {
      timestamp: "2024-01-20T14:19:45Z",
      level: "Warning",
      message: "Deadlock detected between sessions 52 and 73",
      source: "Lock Manager",
    },
    {
      timestamp: "2024-01-20T14:17:33Z",
      level: "Info",
      message: "Database backup initiated for ecommerce-sql-db",
      source: "Backup Service",
    },
  ],
  3: [
    // Storage Account
    {
      timestamp: "2024-01-20T14:21:44Z",
      level: "Info",
      message: "Blob uploaded successfully: /images/product-123.jpg",
      source: "Blob Service",
    },
    {
      timestamp: "2024-01-20T14:19:12Z",
      level: "Warning",
      message: "Failed to delete expired blob: /temp/session-abc123",
      source: "Lifecycle Management",
    },
    {
      timestamp: "2024-01-20T14:16:55Z",
      level: "Info",
      message: "Table entity updated in customer table",
      source: "Table Service",
    },
  ],
  4: [
    // Application Insights
    {
      timestamp: "2024-01-20T14:23:12Z",
      level: "Error",
      message:
        "Exception tracked: NullReferenceException in ProductController.GetProduct",
      source: "Exception Tracking",
    },
    {
      timestamp: "2024-01-20T14:20:45Z",
      level: "Info",
      message: "Custom event tracked: ProductPurchased with properties",
      source: "Event Tracking",
    },
    {
      timestamp: "2024-01-20T14:18:33Z",
      level: "Warning",
      message: "Dependency call failed: Redis cache connection timeout",
      source: "Dependency Tracking",
    },
  ],
};

// Current metrics by resource ID (for overview cards)
export const mockCurrentMetrics: Record<number, Record<string, any>> = {
  1: {
    // App Service
    cpu: { current: 45, average: 38, max: 89 },
    memory: { current: 62, average: 55, max: 78 },
    requests: { current: 1250, total: 50000, errorsToday: 23 },
    responseTime: { current: 285, average: 320, p95: 450 },
  },
  2: {
    // SQL Database
    dtu: { current: 75, average: 65, max: 95 },
    storage: { current: 45, max: 250, percentage: 18 },
    connections: { current: 85, max: 200, average: 92 },
    queryDuration: { current: 1.2, average: 0.8, p95: 2.5 },
  },
  3: {
    // Storage Account
    capacity: { used: 1.2, total: 5.0, percentage: 24 },
    transactions: { current: 450, total: 125000, errorsToday: 5 },
    egress: { current: 2.5, total: 450.2, unit: "GB" },
    availability: { current: 99.99, average: 99.95, sla: 99.9 },
  },
  4: {
    // Application Insights
    telemetryVolume: { current: 25000, total: 1200000, dailyLimit: 100000 },
    exceptions: { current: 12, total: 450, rate: 2.1 },
    dependencies: { current: 350, failed: 8, averageTime: 125 },
    users: { active: 450, daily: 1200, weekly: 8500 },
  },
};

// Helper function to get resource data by ID
export const getResourceData = (resourceId: number): ResourceData | null => {
  return mockResourcesData[resourceId] || null;
};

export const getResourceAlerts = (resourceId: number): ResourceAlert[] => {
  return mockResourceAlerts[resourceId] || [];
};

export const getResourceLogs = (resourceId: number): ResourceLog[] => {
  return mockResourceLogs[resourceId] || [];
};

export const getCurrentMetrics = (resourceId: number): Record<string, any> => {
  return (
    mockCurrentMetrics[resourceId] || {
      cpu: { current: 0, average: 0, max: 0 },
      memory: { current: 0, average: 0, max: 0 },
      requests: { current: 0, total: 0, errorsToday: 0 },
      responseTime: { current: 0, average: 0, p95: 0 },
    }
  );
};

// Helper function to get resources for a specific project
export const getResourcesForProject = (projectId: number): ResourceData[] => {
  // For now, return all resources for any project
  // In a real app, you would filter based on the project ID
  return Object.values(mockResourcesData);
};
