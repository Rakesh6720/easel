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

// Project to Resources Mapping
export const projectResourceMapping: Record<number, number[]> = {
  1: [1, 2, 3, 4], // E-commerce project has all resources
  2: [5, 6], // Analytics project has different resources
  3: [7, 8, 9], // Mobile app project has different resources
};

// Additional resources for other projects
export const additionalMockResources: Record<number, ResourceData> = {
  5: {
    id: 5,
    name: "analytics-function-app",
    type: "microsoft.web/sites",
    status: "running",
    location: "West US 2",
    region: "West US 2",
    cost: 89.5,
    lastUpdated: "2024-01-21T10:30:00Z",
    createdAt: "2024-01-18T14:20:00Z",
    resourceGroup: "analytics-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/analytics-rg/providers/Microsoft.Web/sites/analytics-function-app",
    configuration: {
      sku: "Y1",
      runtime: "Python 3.9",
      platform: "Linux",
      instances: 0,
      autoScale: true,
      httpsOnly: true,
      ftpsState: "Disabled",
    },
  },
  6: {
    id: 6,
    name: "analytics-cosmos-db",
    type: "microsoft.documentdb/databaseaccounts",
    status: "running",
    location: "West US 2",
    region: "West US 2",
    cost: 245.8,
    lastUpdated: "2024-01-21T09:15:00Z",
    createdAt: "2024-01-18T15:45:00Z",
    resourceGroup: "analytics-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/analytics-rg/providers/Microsoft.DocumentDB/databaseAccounts/analytics-cosmos-db",
    configuration: {
      tier: "Standard",
      consistency: "Session",
      multiRegion: true,
      backupPolicy: "Continuous",
      throughput: 1000,
      partitionKey: "/userId",
    },
  },
  7: {
    id: 7,
    name: "mobile-app-service",
    type: "microsoft.web/sites",
    status: "running",
    location: "Central US",
    region: "Central US",
    cost: 125.75,
    lastUpdated: "2024-01-21T11:45:00Z",
    createdAt: "2024-01-19T09:30:00Z",
    resourceGroup: "mobile-app-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/mobile-app-rg/providers/Microsoft.Web/sites/mobile-app-service",
    configuration: {
      sku: "P1V2",
      runtime: "Node.js 18",
      platform: "Linux",
      instances: 2,
      autoScale: true,
      httpsOnly: true,
      ftpsState: "Disabled",
    },
  },
  8: {
    id: 8,
    name: "mobile-redis-cache",
    type: "microsoft.cache/redis",
    status: "running",
    location: "Central US",
    region: "Central US",
    cost: 67.2,
    lastUpdated: "2024-01-21T08:20:00Z",
    createdAt: "2024-01-19T10:15:00Z",
    resourceGroup: "mobile-app-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/mobile-app-rg/providers/Microsoft.Cache/Redis/mobile-redis-cache",
    configuration: {
      tier: "Standard",
      capacity: "C1",
      redisVersion: "6.0",
      sslEnabled: true,
      nonSslEnabled: false,
      maxClients: 1000,
    },
  },
  9: {
    id: 9,
    name: "mobile-notification-hub",
    type: "microsoft.notificationhubs/namespaces/notificationhubs",
    status: "Active",
    location: "Central US",
    region: "Central US",
    cost: 15.99,
    lastUpdated: "2024-01-21T07:30:00Z",
    createdAt: "2024-01-19T11:00:00Z",
    resourceGroup: "mobile-app-rg",
    subscription: "Easel Development",
    azureResourceId:
      "/subscriptions/xxx/resourceGroups/mobile-app-rg/providers/Microsoft.NotificationHubs/namespaces/mobile-notifications/notificationHubs/mobile-notification-hub",
    configuration: {
      tier: "Standard",
      pushEnabled: true,
      registrationTtl: "90.00:00:00",
      apnsCredential: "Configured",
      gcmCredential: "Configured",
      wnsCredential: "Configured",
    },
  },
};

// Combine all resources
export const allMockResourcesData = {
  ...mockResourcesData,
  ...additionalMockResources,
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
  5: [
    // Analytics Function App
    {
      id: 1,
      severity: "Info",
      message: "Function execution completed successfully",
      triggeredAt: "2024-01-21T10:00:00Z",
      resolved: true,
    },
    {
      id: 2,
      severity: "Warning",
      message: "Cold start detected - function warming up",
      triggeredAt: "2024-01-21T09:30:00Z",
      resolved: true,
    },
  ],
  6: [
    // Cosmos DB
    {
      id: 1,
      severity: "Warning",
      message: "Request unit consumption approaching limit",
      triggeredAt: "2024-01-21T08:45:00Z",
      resolved: false,
    },
    {
      id: 2,
      severity: "Info",
      message: "Multi-region replication completed",
      triggeredAt: "2024-01-21T07:30:00Z",
      resolved: true,
    },
  ],
  7: [
    // Mobile App Service
    {
      id: 1,
      severity: "Info",
      message: "Auto-scaling triggered - added new instance",
      triggeredAt: "2024-01-21T11:20:00Z",
      resolved: true,
    },
    {
      id: 2,
      severity: "Warning",
      message: "Memory usage above 75%",
      triggeredAt: "2024-01-21T10:45:00Z",
      resolved: false,
    },
  ],
  8: [
    // Redis Cache
    {
      id: 1,
      severity: "Info",
      message: "Cache hit ratio optimal (>95%)",
      triggeredAt: "2024-01-21T08:00:00Z",
      resolved: true,
    },
    {
      id: 2,
      severity: "Warning",
      message: "High connection count detected",
      triggeredAt: "2024-01-21T07:15:00Z",
      resolved: true,
    },
  ],
  9: [
    // Notification Hub
    {
      id: 1,
      severity: "Info",
      message: "Push notification batch sent successfully",
      triggeredAt: "2024-01-21T06:30:00Z",
      resolved: true,
    },
    {
      id: 2,
      severity: "Warning",
      message: "iOS certificate expires in 30 days",
      triggeredAt: "2024-01-21T05:00:00Z",
      resolved: false,
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
  5: [
    // Analytics Function App
    {
      timestamp: "2024-01-21T10:25:18Z",
      level: "Info",
      message: "Function processed analytics batch: 1,250 events",
      source: "Function Runtime",
    },
    {
      timestamp: "2024-01-21T10:22:45Z",
      level: "Warning",
      message: "Cold start detected: function initialization took 2.3s",
      source: "Function Runtime",
    },
    {
      timestamp: "2024-01-21T10:20:12Z",
      level: "Info",
      message: "Cosmos DB connection established successfully",
      source: "Database",
    },
  ],
  6: [
    // Cosmos DB
    {
      timestamp: "2024-01-21T09:30:22Z",
      level: "Info",
      message: "Document inserted successfully into analytics collection",
      source: "Document Service",
    },
    {
      timestamp: "2024-01-21T09:28:15Z",
      level: "Warning",
      message: "Request unit rate limit reached for partition key /user123",
      source: "Throttling",
    },
    {
      timestamp: "2024-01-21T09:25:44Z",
      level: "Info",
      message: "Cross-region replication completed: West US 2 → East US",
      source: "Replication",
    },
  ],
  7: [
    // Mobile App Service
    {
      timestamp: "2024-01-21T11:40:18Z",
      level: "Info",
      message: "API endpoint /api/users responded in 145ms",
      source: "Application",
    },
    {
      timestamp: "2024-01-21T11:38:22Z",
      level: "Error",
      message: "Authentication failed for mobile client: invalid token",
      source: "Authentication",
    },
    {
      timestamp: "2024-01-21T11:35:55Z",
      level: "Info",
      message: "Auto-scaling triggered: scaling out to 3 instances",
      source: "Auto Scaler",
    },
  ],
  8: [
    // Redis Cache
    {
      timestamp: "2024-01-21T08:15:30Z",
      level: "Info",
      message: "Cache GET operation completed: key 'user:session:abc123'",
      source: "Cache Engine",
    },
    {
      timestamp: "2024-01-21T08:12:45Z",
      level: "Warning",
      message: "Memory usage at 85% - consider scaling up",
      source: "Memory Monitor",
    },
    {
      timestamp: "2024-01-21T08:10:22Z",
      level: "Info",
      message: "Connection pool optimized: 45 active connections",
      source: "Connection Manager",
    },
  ],
  9: [
    // Notification Hub
    {
      timestamp: "2024-01-21T06:25:12Z",
      level: "Info",
      message: "Push notification sent to 1,250 iOS devices",
      source: "APNS Provider",
    },
    {
      timestamp: "2024-01-21T06:22:33Z",
      level: "Warning",
      message: "FCM notification failed for 3 Android devices",
      source: "FCM Provider",
    },
    {
      timestamp: "2024-01-21T06:20:45Z",
      level: "Info",
      message: "Registration updated for device token abc123",
      source: "Registration Service",
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
  5: {
    // Analytics Function App
    cpu: { current: 15, average: 12, max: 45 },
    memory: { current: 125, average: 110, max: 180 }, // MB
    executions: { current: 850, total: 25000, errorsToday: 2 },
    duration: { current: 1.8, average: 2.1, p95: 4.2 }, // seconds
  },
  6: {
    // Cosmos DB
    requestUnits: { current: 750, total: 1000, percentage: 75 },
    storage: { used: 15.8, total: 100, percentage: 15.8 }, // GB
    throughput: { current: 850, provisioned: 1000, autoscale: true },
    latency: { read: 2.5, write: 4.1, average: 3.2 }, // ms
  },
  7: {
    // Mobile App Service
    cpu: { current: 68, average: 55, max: 85 },
    memory: { current: 74, average: 65, max: 89 },
    requests: { current: 2150, total: 95000, errorsToday: 8 },
    responseTime: { current: 195, average: 220, p95: 380 },
  },
  8: {
    // Redis Cache
    memory: { used: 850, total: 1000, percentage: 85 }, // MB
    connections: { current: 45, max: 1000, average: 52 },
    operations: { current: 1250, total: 450000, hitRate: 96.5 },
    latency: { current: 0.8, average: 1.1, p95: 2.2 }, // ms
  },
  9: {
    // Notification Hub
    registrations: { active: 15000, total: 18000, percentage: 83.3 },
    notifications: { sent: 1250, failed: 15, successRate: 98.8 },
    platforms: { ios: 8500, android: 6200, windows: 300 },
    throughput: { current: 450, max: 1000, average: 380 }, // per minute
  },
};

// Helper function to get resource data by ID
export const getResourceData = (resourceId: number): ResourceData | null => {
  return allMockResourcesData[resourceId] || null;
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
  const resourceIds = projectResourceMapping[projectId] || [];
  return resourceIds
    .map((id) => allMockResourcesData[id])
    .filter((resource) => resource !== undefined);
};

// Helper function to get project info
export const getProjectInfo = (projectId: number) => {
  const projectInfo: Record<
    number,
    {
      name: string;
      description: string;
      status: string;
      environment: string;
      lastDeployed: string;
    }
  > = {
    1: {
      name: "E-commerce Platform",
      description: "Full-stack e-commerce application with payment processing",
      status: "Active",
      environment: "Production",
      lastDeployed: "2024-01-20T15:30:00Z",
    },
    2: {
      name: "Analytics Dashboard",
      description: "Real-time analytics and reporting system",
      status: "Active",
      environment: "Production",
      lastDeployed: "2024-01-21T10:30:00Z",
    },
    3: {
      name: "Mobile App Backend",
      description: "API and services for mobile application",
      status: "Development",
      environment: "Staging",
      lastDeployed: "2024-01-21T11:45:00Z",
    },
  };

  return (
    projectInfo[projectId] || {
      name: `Project ${projectId}`,
      description: "Project description not available",
      status: "Unknown",
      environment: "Unknown",
      lastDeployed: "Unknown",
    }
  );
};
