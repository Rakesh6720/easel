// Mock Azure Monitor API response data
// This mimics the exact structure returned by Azure Monitor REST API

export interface AzureMetricDataPoint {
  timeStamp: string;
  average?: number;
  total?: number;
  minimum?: number;
  maximum?: number;
}

export interface AzureMetricTimeSeries {
  metadatavalues: Array<{
    name: {
      value: string;
      localizedValue: string;
    };
    value: string;
  }>;
  data: AzureMetricDataPoint[];
}

export interface AzureMetric {
  id: string;
  type: string;
  name: {
    value: string;
    localizedValue: string;
  };
  displayDescription: string;
  unit: string;
  timeseries: AzureMetricTimeSeries[];
}

export interface AzureMetricsResponse {
  timespan: string;
  interval: string;
  value: AzureMetric[];
  namespace: string;
  resourceregion: string;
}

export const mockAzureMetricsResponse: AzureMetricsResponse = {
  timespan: "2024-01-20T00:00:00Z/2024-01-20T23:59:59Z",
  interval: "PT1H",
  value: [
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-app-service/providers/Microsoft.Insights/metrics/CpuPercentage",
      type: "Microsoft.Insights/metrics",
      name: {
        value: "CpuPercentage",
        localizedValue: "CPU Percentage"
      },
      displayDescription: "The percentage of CPU consumed by the app.",
      unit: "Percent",
      timeseries: [
        {
          metadatavalues: [],
          data: [
            { timeStamp: "2024-01-20T00:00:00Z", average: 32.5 },
            { timeStamp: "2024-01-20T01:00:00Z", average: 28.3 },
            { timeStamp: "2024-01-20T02:00:00Z", average: 25.1 },
            { timeStamp: "2024-01-20T03:00:00Z", average: 22.8 },
            { timeStamp: "2024-01-20T04:00:00Z", average: 24.6 },
            { timeStamp: "2024-01-20T05:00:00Z", average: 31.2 },
            { timeStamp: "2024-01-20T06:00:00Z", average: 38.7 },
            { timeStamp: "2024-01-20T07:00:00Z", average: 45.3 },
            { timeStamp: "2024-01-20T08:00:00Z", average: 52.1 },
            { timeStamp: "2024-01-20T09:00:00Z", average: 58.9 },
            { timeStamp: "2024-01-20T10:00:00Z", average: 65.4 },
            { timeStamp: "2024-01-20T11:00:00Z", average: 71.2 },
            { timeStamp: "2024-01-20T12:00:00Z", average: 68.7 },
            { timeStamp: "2024-01-20T13:00:00Z", average: 72.8 },
            { timeStamp: "2024-01-20T14:00:00Z", average: 45.0 },
            { timeStamp: "2024-01-20T15:00:00Z", average: 42.3 },
            { timeStamp: "2024-01-20T16:00:00Z", average: 48.6 },
            { timeStamp: "2024-01-20T17:00:00Z", average: 55.1 },
            { timeStamp: "2024-01-20T18:00:00Z", average: 51.8 },
            { timeStamp: "2024-01-20T19:00:00Z", average: 46.2 },
            { timeStamp: "2024-01-20T20:00:00Z", average: 41.7 },
            { timeStamp: "2024-01-20T21:00:00Z", average: 38.9 },
            { timeStamp: "2024-01-20T22:00:00Z", average: 35.4 },
            { timeStamp: "2024-01-20T23:00:00Z", average: 33.1 }
          ]
        }
      ]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-app-service/providers/Microsoft.Insights/metrics/MemoryPercentage",
      type: "Microsoft.Insights/metrics",
      name: {
        value: "MemoryPercentage",
        localizedValue: "Memory Percentage"
      },
      displayDescription: "The percentage of memory used by the app.",
      unit: "Percent",
      timeseries: [
        {
          metadatavalues: [],
          data: [
            { timeStamp: "2024-01-20T00:00:00Z", average: 42.1 },
            { timeStamp: "2024-01-20T01:00:00Z", average: 38.9 },
            { timeStamp: "2024-01-20T02:00:00Z", average: 35.7 },
            { timeStamp: "2024-01-20T03:00:00Z", average: 33.2 },
            { timeStamp: "2024-01-20T04:00:00Z", average: 36.8 },
            { timeStamp: "2024-01-20T05:00:00Z", average: 41.5 },
            { timeStamp: "2024-01-20T06:00:00Z", average: 46.3 },
            { timeStamp: "2024-01-20T07:00:00Z", average: 52.7 },
            { timeStamp: "2024-01-20T08:00:00Z", average: 58.2 },
            { timeStamp: "2024-01-20T09:00:00Z", average: 64.1 },
            { timeStamp: "2024-01-20T10:00:00Z", average: 68.9 },
            { timeStamp: "2024-01-20T11:00:00Z", average: 72.3 },
            { timeStamp: "2024-01-20T12:00:00Z", average: 69.7 },
            { timeStamp: "2024-01-20T13:00:00Z", average: 71.8 },
            { timeStamp: "2024-01-20T14:00:00Z", average: 62.0 },
            { timeStamp: "2024-01-20T15:00:00Z", average: 58.4 },
            { timeStamp: "2024-01-20T16:00:00Z", average: 61.2 },
            { timeStamp: "2024-01-20T17:00:00Z", average: 65.8 },
            { timeStamp: "2024-01-20T18:00:00Z", average: 63.1 },
            { timeStamp: "2024-01-20T19:00:00Z", average: 59.6 },
            { timeStamp: "2024-01-20T20:00:00Z", average: 55.3 },
            { timeStamp: "2024-01-20T21:00:00Z", average: 51.7 },
            { timeStamp: "2024-01-20T22:00:00Z", average: 48.2 },
            { timeStamp: "2024-01-20T23:00:00Z", average: 45.8 }
          ]
        }
      ]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-app-service/providers/Microsoft.Insights/metrics/Requests",
      type: "Microsoft.Insights/metrics",
      name: {
        value: "Requests",
        localizedValue: "Requests"
      },
      displayDescription: "Total number of requests regardless of their resulting HTTP status code.",
      unit: "Count",
      timeseries: [
        {
          metadatavalues: [],
          data: [
            { timeStamp: "2024-01-20T00:00:00Z", total: 245 },
            { timeStamp: "2024-01-20T01:00:00Z", total: 198 },
            { timeStamp: "2024-01-20T02:00:00Z", total: 156 },
            { timeStamp: "2024-01-20T03:00:00Z", total: 123 },
            { timeStamp: "2024-01-20T04:00:00Z", total: 145 },
            { timeStamp: "2024-01-20T05:00:00Z", total: 234 },
            { timeStamp: "2024-01-20T06:00:00Z", total: 387 },
            { timeStamp: "2024-01-20T07:00:00Z", total: 542 },
            { timeStamp: "2024-01-20T08:00:00Z", total: 721 },
            { timeStamp: "2024-01-20T09:00:00Z", total: 892 },
            { timeStamp: "2024-01-20T10:00:00Z", total: 1123 },
            { timeStamp: "2024-01-20T11:00:00Z", total: 1287 },
            { timeStamp: "2024-01-20T12:00:00Z", total: 1156 },
            { timeStamp: "2024-01-20T13:00:00Z", total: 1342 },
            { timeStamp: "2024-01-20T14:00:00Z", total: 1250 },
            { timeStamp: "2024-01-20T15:00:00Z", total: 1198 },
            { timeStamp: "2024-01-20T16:00:00Z", total: 1087 },
            { timeStamp: "2024-01-20T17:00:00Z", total: 956 },
            { timeStamp: "2024-01-20T18:00:00Z", total: 834 },
            { timeStamp: "2024-01-20T19:00:00Z", total: 723 },
            { timeStamp: "2024-01-20T20:00:00Z", total: 612 },
            { timeStamp: "2024-01-20T21:00:00Z", total: 498 },
            { timeStamp: "2024-01-20T22:00:00Z", total: 387 },
            { timeStamp: "2024-01-20T23:00:00Z", total: 298 }
          ]
        }
      ]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-app-service/providers/Microsoft.Insights/metrics/AverageResponseTime",
      type: "Microsoft.Insights/metrics",
      name: {
        value: "AverageResponseTime",
        localizedValue: "Average Response Time"
      },
      displayDescription: "The average time taken for the app to serve requests.",
      unit: "Seconds",
      timeseries: [
        {
          metadatavalues: [],
          data: [
            { timeStamp: "2024-01-20T00:00:00Z", average: 0.245 },
            { timeStamp: "2024-01-20T01:00:00Z", average: 0.198 },
            { timeStamp: "2024-01-20T02:00:00Z", average: 0.156 },
            { timeStamp: "2024-01-20T03:00:00Z", average: 0.134 },
            { timeStamp: "2024-01-20T04:00:00Z", average: 0.167 },
            { timeStamp: "2024-01-20T05:00:00Z", average: 0.223 },
            { timeStamp: "2024-01-20T06:00:00Z", average: 0.287 },
            { timeStamp: "2024-01-20T07:00:00Z", average: 0.345 },
            { timeStamp: "2024-01-20T08:00:00Z", average: 0.412 },
            { timeStamp: "2024-01-20T09:00:00Z", average: 0.456 },
            { timeStamp: "2024-01-20T10:00:00Z", average: 0.523 },
            { timeStamp: "2024-01-20T11:00:00Z", average: 0.587 },
            { timeStamp: "2024-01-20T12:00:00Z", average: 0.498 },
            { timeStamp: "2024-01-20T13:00:00Z", average: 0.612 },
            { timeStamp: "2024-01-20T14:00:00Z", average: 0.285 },
            { timeStamp: "2024-01-20T15:00:00Z", average: 0.267 },
            { timeStamp: "2024-01-20T16:00:00Z", average: 0.289 },
            { timeStamp: "2024-01-20T17:00:00Z", average: 0.334 },
            { timeStamp: "2024-01-20T18:00:00Z", average: 0.298 },
            { timeStamp: "2024-01-20T19:00:00Z", average: 0.276 },
            { timeStamp: "2024-01-20T20:00:00Z", average: 0.254 },
            { timeStamp: "2024-01-20T21:00:00Z", average: 0.223 },
            { timeStamp: "2024-01-20T22:00:00Z", average: 0.198 },
            { timeStamp: "2024-01-20T23:00:00Z", average: 0.187 }
          ]
        }
      ]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-app-service/providers/Microsoft.Insights/metrics/Http4xx",
      type: "Microsoft.Insights/metrics",
      name: {
        value: "Http4xx",
        localizedValue: "Http 4xx"
      },
      displayDescription: "The count of requests resulting in HTTP status code >= 400 but < 500.",
      unit: "Count",
      timeseries: [
        {
          metadatavalues: [],
          data: [
            { timeStamp: "2024-01-20T00:00:00Z", total: 2 },
            { timeStamp: "2024-01-20T01:00:00Z", total: 1 },
            { timeStamp: "2024-01-20T02:00:00Z", total: 0 },
            { timeStamp: "2024-01-20T03:00:00Z", total: 1 },
            { timeStamp: "2024-01-20T04:00:00Z", total: 2 },
            { timeStamp: "2024-01-20T05:00:00Z", total: 3 },
            { timeStamp: "2024-01-20T06:00:00Z", total: 5 },
            { timeStamp: "2024-01-20T07:00:00Z", total: 8 },
            { timeStamp: "2024-01-20T08:00:00Z", total: 12 },
            { timeStamp: "2024-01-20T09:00:00Z", total: 15 },
            { timeStamp: "2024-01-20T10:00:00Z", total: 18 },
            { timeStamp: "2024-01-20T11:00:00Z", total: 21 },
            { timeStamp: "2024-01-20T12:00:00Z", total: 19 },
            { timeStamp: "2024-01-20T13:00:00Z", total: 23 },
            { timeStamp: "2024-01-20T14:00:00Z", total: 20 },
            { timeStamp: "2024-01-20T15:00:00Z", total: 17 },
            { timeStamp: "2024-01-20T16:00:00Z", total: 14 },
            { timeStamp: "2024-01-20T17:00:00Z", total: 11 },
            { timeStamp: "2024-01-20T18:00:00Z", total: 9 },
            { timeStamp: "2024-01-20T19:00:00Z", total: 7 },
            { timeStamp: "2024-01-20T20:00:00Z", total: 5 },
            { timeStamp: "2024-01-20T21:00:00Z", total: 4 },
            { timeStamp: "2024-01-20T22:00:00Z", total: 3 },
            { timeStamp: "2024-01-20T23:00:00Z", total: 2 }
          ]
        }
      ]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-app-service/providers/Microsoft.Insights/metrics/BytesReceived",
      type: "Microsoft.Insights/metrics",
      name: {
        value: "BytesReceived",
        localizedValue: "Data In"
      },
      displayDescription: "The amount of incoming bandwidth consumed by the app.",
      unit: "Bytes",
      timeseries: [
        {
          metadatavalues: [],
          data: [
            { timeStamp: "2024-01-20T00:00:00Z", total: 2450000 },
            { timeStamp: "2024-01-20T01:00:00Z", total: 1980000 },
            { timeStamp: "2024-01-20T02:00:00Z", total: 1560000 },
            { timeStamp: "2024-01-20T03:00:00Z", total: 1230000 },
            { timeStamp: "2024-01-20T04:00:00Z", total: 1450000 },
            { timeStamp: "2024-01-20T05:00:00Z", total: 2340000 },
            { timeStamp: "2024-01-20T06:00:00Z", total: 3870000 },
            { timeStamp: "2024-01-20T07:00:00Z", total: 5420000 },
            { timeStamp: "2024-01-20T08:00:00Z", total: 7210000 },
            { timeStamp: "2024-01-20T09:00:00Z", total: 8920000 },
            { timeStamp: "2024-01-20T10:00:00Z", total: 11230000 },
            { timeStamp: "2024-01-20T11:00:00Z", total: 12870000 },
            { timeStamp: "2024-01-20T12:00:00Z", total: 11560000 },
            { timeStamp: "2024-01-20T13:00:00Z", total: 13420000 },
            { timeStamp: "2024-01-20T14:00:00Z", total: 12500000 },
            { timeStamp: "2024-01-20T15:00:00Z", total: 11980000 },
            { timeStamp: "2024-01-20T16:00:00Z", total: 10870000 },
            { timeStamp: "2024-01-20T17:00:00Z", total: 9560000 },
            { timeStamp: "2024-01-20T18:00:00Z", total: 8340000 },
            { timeStamp: "2024-01-20T19:00:00Z", total: 7230000 },
            { timeStamp: "2024-01-20T20:00:00Z", total: 6120000 },
            { timeStamp: "2024-01-20T21:00:00Z", total: 4980000 },
            { timeStamp: "2024-01-20T22:00:00Z", total: 3870000 },
            { timeStamp: "2024-01-20T23:00:00Z", total: 2980000 }
          ]
        }
      ]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Web/sites/ecommerce-app-service/providers/Microsoft.Insights/metrics/BytesSent",
      type: "Microsoft.Insights/metrics",
      name: {
        value: "BytesSent",
        localizedValue: "Data Out"
      },
      displayDescription: "The amount of outgoing bandwidth consumed by the app.",
      unit: "Bytes",
      timeseries: [
        {
          metadatavalues: [],
          data: [
            { timeStamp: "2024-01-20T00:00:00Z", total: 12250000 },
            { timeStamp: "2024-01-20T01:00:00Z", total: 9900000 },
            { timeStamp: "2024-01-20T02:00:00Z", total: 7800000 },
            { timeStamp: "2024-01-20T03:00:00Z", total: 6150000 },
            { timeStamp: "2024-01-20T04:00:00Z", total: 7250000 },
            { timeStamp: "2024-01-20T05:00:00Z", total: 11700000 },
            { timeStamp: "2024-01-20T06:00:00Z", total: 19350000 },
            { timeStamp: "2024-01-20T07:00:00Z", total: 27100000 },
            { timeStamp: "2024-01-20T08:00:00Z", total: 36050000 },
            { timeStamp: "2024-01-20T09:00:00Z", total: 44600000 },
            { timeStamp: "2024-01-20T10:00:00Z", total: 56150000 },
            { timeStamp: "2024-01-20T11:00:00Z", total: 64350000 },
            { timeStamp: "2024-01-20T12:00:00Z", total: 57800000 },
            { timeStamp: "2024-01-20T13:00:00Z", total: 67100000 },
            { timeStamp: "2024-01-20T14:00:00Z", total: 62500000 },
            { timeStamp: "2024-01-20T15:00:00Z", total: 59900000 },
            { timeStamp: "2024-01-20T16:00:00Z", total: 54350000 },
            { timeStamp: "2024-01-20T17:00:00Z", total: 47800000 },
            { timeStamp: "2024-01-20T18:00:00Z", total: 41700000 },
            { timeStamp: "2024-01-20T19:00:00Z", total: 36150000 },
            { timeStamp: "2024-01-20T20:00:00Z", total: 30600000 },
            { timeStamp: "2024-01-20T21:00:00Z", total: 24900000 },
            { timeStamp: "2024-01-20T22:00:00Z", total: 19350000 },
            { timeStamp: "2024-01-20T23:00:00Z", total: 14900000 }
          ]
        }
      ]
    }
  ],
  namespace: "Microsoft.Web/sites",
  resourceregion: "eastus"
};

// Resource-specific Azure Monitor metrics data
const mockSqlDatabaseMetrics: AzureMetricsResponse = {
  timespan: "2024-01-20T00:00:00Z/2024-01-20T23:59:59Z",
  interval: "PT1H",
  value: [
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Sql/servers/ecommerce-sql-server/databases/ecommerce-sql-db/providers/Microsoft.Insights/metrics/dtu_consumption_percent",
      type: "Microsoft.Insights/metrics",
      name: { value: "dtu_consumption_percent", localizedValue: "DTU Percentage" },
      displayDescription: "Database throughput unit percentage",
      unit: "Percent",
      timeseries: [{
        metadatavalues: [],
        data: [
          { timeStamp: "2024-01-20T00:00:00Z", average: 25.5 },
          { timeStamp: "2024-01-20T01:00:00Z", average: 22.1 },
          { timeStamp: "2024-01-20T02:00:00Z", average: 18.7 },
          { timeStamp: "2024-01-20T03:00:00Z", average: 15.3 },
          { timeStamp: "2024-01-20T04:00:00Z", average: 19.8 },
          { timeStamp: "2024-01-20T05:00:00Z", average: 28.4 },
          { timeStamp: "2024-01-20T06:00:00Z", average: 42.1 },
          { timeStamp: "2024-01-20T07:00:00Z", average: 58.6 },
          { timeStamp: "2024-01-20T08:00:00Z", average: 72.3 },
          { timeStamp: "2024-01-20T09:00:00Z", average: 85.7 },
          { timeStamp: "2024-01-20T10:00:00Z", average: 89.2 },
          { timeStamp: "2024-01-20T11:00:00Z", average: 91.8 },
          { timeStamp: "2024-01-20T12:00:00Z", average: 87.4 },
          { timeStamp: "2024-01-20T13:00:00Z", average: 93.6 },
          { timeStamp: "2024-01-20T14:00:00Z", average: 75.0 },
          { timeStamp: "2024-01-20T15:00:00Z", average: 68.9 },
          { timeStamp: "2024-01-20T16:00:00Z", average: 71.2 },
          { timeStamp: "2024-01-20T17:00:00Z", average: 76.8 },
          { timeStamp: "2024-01-20T18:00:00Z", average: 69.3 },
          { timeStamp: "2024-01-20T19:00:00Z", average: 61.7 },
          { timeStamp: "2024-01-20T20:00:00Z", average: 54.2 },
          { timeStamp: "2024-01-20T21:00:00Z", average: 47.8 },
          { timeStamp: "2024-01-20T22:00:00Z", average: 39.1 },
          { timeStamp: "2024-01-20T23:00:00Z", average: 32.5 }
        ]
      }]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Sql/servers/ecommerce-sql-server/databases/ecommerce-sql-db/providers/Microsoft.Insights/metrics/storage_percent",
      type: "Microsoft.Insights/metrics",
      name: { value: "storage_percent", localizedValue: "Data space used percent" },
      displayDescription: "Percentage of data space used",
      unit: "Percent",
      timeseries: [{
        metadatavalues: [],
        data: [
          { timeStamp: "2024-01-20T00:00:00Z", average: 18.2 },
          { timeStamp: "2024-01-20T06:00:00Z", average: 18.3 },
          { timeStamp: "2024-01-20T12:00:00Z", average: 18.4 },
          { timeStamp: "2024-01-20T18:00:00Z", average: 18.5 },
          { timeStamp: "2024-01-20T23:00:00Z", average: 18.6 }
        ]
      }]
    }
  ],
  namespace: "Microsoft.Sql/servers/databases",
  resourceregion: "eastus"
};

const mockStorageAccountMetrics: AzureMetricsResponse = {
  timespan: "2024-01-20T00:00:00Z/2024-01-20T23:59:59Z",
  interval: "PT1H",
  value: [
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage/providers/Microsoft.Insights/metrics/UsedCapacity",
      type: "Microsoft.Insights/metrics",
      name: { value: "UsedCapacity", localizedValue: "Used capacity" },
      displayDescription: "The amount of storage used by the storage account",
      unit: "Bytes",
      timeseries: [{
        metadatavalues: [],
        data: [
          { timeStamp: "2024-01-20T00:00:00Z", average: 1288490188 }, // ~1.2GB
          { timeStamp: "2024-01-20T06:00:00Z", average: 1294967296 },
          { timeStamp: "2024-01-20T12:00:00Z", average: 1301313024 },
          { timeStamp: "2024-01-20T18:00:00Z", average: 1307435264 },
          { timeStamp: "2024-01-20T23:00:00Z", average: 1313685248 }
        ]
      }]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Storage/storageAccounts/ecommercestorage/providers/Microsoft.Insights/metrics/Transactions",
      type: "Microsoft.Insights/metrics",
      name: { value: "Transactions", localizedValue: "Transactions" },
      displayDescription: "The number of requests made to a storage service",
      unit: "Count",
      timeseries: [{
        metadatavalues: [],
        data: [
          { timeStamp: "2024-01-20T00:00:00Z", total: 125 },
          { timeStamp: "2024-01-20T01:00:00Z", total: 98 },
          { timeStamp: "2024-01-20T02:00:00Z", total: 67 },
          { timeStamp: "2024-01-20T03:00:00Z", total: 45 },
          { timeStamp: "2024-01-20T04:00:00Z", total: 52 },
          { timeStamp: "2024-01-20T05:00:00Z", total: 89 },
          { timeStamp: "2024-01-20T06:00:00Z", total: 156 },
          { timeStamp: "2024-01-20T07:00:00Z", total: 234 },
          { timeStamp: "2024-01-20T08:00:00Z", total: 321 },
          { timeStamp: "2024-01-20T09:00:00Z", total: 412 },
          { timeStamp: "2024-01-20T10:00:00Z", total: 523 },
          { timeStamp: "2024-01-20T11:00:00Z", total: 612 },
          { timeStamp: "2024-01-20T12:00:00Z", total: 567 },
          { timeStamp: "2024-01-20T13:00:00Z", total: 634 },
          { timeStamp: "2024-01-20T14:00:00Z", total: 450 },
          { timeStamp: "2024-01-20T15:00:00Z", total: 398 },
          { timeStamp: "2024-01-20T16:00:00Z", total: 423 },
          { timeStamp: "2024-01-20T17:00:00Z", total: 456 },
          { timeStamp: "2024-01-20T18:00:00Z", total: 389 },
          { timeStamp: "2024-01-20T19:00:00Z", total: 334 },
          { timeStamp: "2024-01-20T20:00:00Z", total: 287 },
          { timeStamp: "2024-01-20T21:00:00Z", total: 234 },
          { timeStamp: "2024-01-20T22:00:00Z", total: 189 },
          { timeStamp: "2024-01-20T23:00:00Z", total: 156 }
        ]
      }]
    }
  ],
  namespace: "Microsoft.Storage/storageAccounts",
  resourceregion: "eastus"
};

const mockApplicationInsightsMetrics: AzureMetricsResponse = {
  timespan: "2024-01-20T00:00:00Z/2024-01-20T23:59:59Z",
  interval: "PT1H",
  value: [
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Insights/components/ecommerce-insights/providers/Microsoft.Insights/metrics/requests/count",
      type: "Microsoft.Insights/metrics",
      name: { value: "requests/count", localizedValue: "Server requests" },
      displayDescription: "Count of server requests",
      unit: "Count",
      timeseries: [{
        metadatavalues: [],
        data: [
          { timeStamp: "2024-01-20T00:00:00Z", total: 1245 },
          { timeStamp: "2024-01-20T01:00:00Z", total: 987 },
          { timeStamp: "2024-01-20T02:00:00Z", total: 756 },
          { timeStamp: "2024-01-20T03:00:00Z", total: 543 },
          { timeStamp: "2024-01-20T04:00:00Z", total: 634 },
          { timeStamp: "2024-01-20T05:00:00Z", total: 898 },
          { timeStamp: "2024-01-20T06:00:00Z", total: 1256 },
          { timeStamp: "2024-01-20T07:00:00Z", total: 1789 },
          { timeStamp: "2024-01-20T08:00:00Z", total: 2345 },
          { timeStamp: "2024-01-20T09:00:00Z", total: 2890 },
          { timeStamp: "2024-01-20T10:00:00Z", total: 3234 },
          { timeStamp: "2024-01-20T11:00:00Z", total: 3567 },
          { timeStamp: "2024-01-20T12:00:00Z", total: 3298 },
          { timeStamp: "2024-01-20T13:00:00Z", total: 3678 },
          { timeStamp: "2024-01-20T14:00:00Z", total: 2500 },
          { timeStamp: "2024-01-20T15:00:00Z", total: 2234 },
          { timeStamp: "2024-01-20T16:00:00Z", total: 2456 },
          { timeStamp: "2024-01-20T17:00:00Z", total: 2678 },
          { timeStamp: "2024-01-20T18:00:00Z", total: 2234 },
          { timeStamp: "2024-01-20T19:00:00Z", total: 1987 },
          { timeStamp: "2024-01-20T20:00:00Z", total: 1654 },
          { timeStamp: "2024-01-20T21:00:00Z", total: 1345 },
          { timeStamp: "2024-01-20T22:00:00Z", total: 1123 },
          { timeStamp: "2024-01-20T23:00:00Z", total: 934 }
        ]
      }]
    },
    {
      id: "/subscriptions/xxx/resourceGroups/ecommerce-rg/providers/Microsoft.Insights/components/ecommerce-insights/providers/Microsoft.Insights/metrics/exceptions/count",
      type: "Microsoft.Insights/metrics",
      name: { value: "exceptions/count", localizedValue: "Exceptions" },
      displayDescription: "Count of exceptions",
      unit: "Count",
      timeseries: [{
        metadatavalues: [],
        data: [
          { timeStamp: "2024-01-20T00:00:00Z", total: 3 },
          { timeStamp: "2024-01-20T01:00:00Z", total: 2 },
          { timeStamp: "2024-01-20T02:00:00Z", total: 1 },
          { timeStamp: "2024-01-20T03:00:00Z", total: 1 },
          { timeStamp: "2024-01-20T04:00:00Z", total: 2 },
          { timeStamp: "2024-01-20T05:00:00Z", total: 4 },
          { timeStamp: "2024-01-20T06:00:00Z", total: 6 },
          { timeStamp: "2024-01-20T07:00:00Z", total: 9 },
          { timeStamp: "2024-01-20T08:00:00Z", total: 14 },
          { timeStamp: "2024-01-20T09:00:00Z", total: 18 },
          { timeStamp: "2024-01-20T10:00:00Z", total: 22 },
          { timeStamp: "2024-01-20T11:00:00Z", total: 25 },
          { timeStamp: "2024-01-20T12:00:00Z", total: 21 },
          { timeStamp: "2024-01-20T13:00:00Z", total: 28 },
          { timeStamp: "2024-01-20T14:00:00Z", total: 12 },
          { timeStamp: "2024-01-20T15:00:00Z", total: 10 },
          { timeStamp: "2024-01-20T16:00:00Z", total: 13 },
          { timeStamp: "2024-01-20T17:00:00Z", total: 16 },
          { timeStamp: "2024-01-20T18:00:00Z", total: 11 },
          { timeStamp: "2024-01-20T19:00:00Z", total: 8 },
          { timeStamp: "2024-01-20T20:00:00Z", total: 6 },
          { timeStamp: "2024-01-20T21:00:00Z", total: 5 },
          { timeStamp: "2024-01-20T22:00:00Z", total: 4 },
          { timeStamp: "2024-01-20T23:00:00Z", total: 3 }
        ]
      }]
    }
  ],
  namespace: "Microsoft.Insights/components",
  resourceregion: "eastus"
};

// Resource-specific metrics mapping
const resourceMetricsMap: Record<number, AzureMetricsResponse> = {
  1: mockAzureMetricsResponse, // App Service (existing)
  2: mockSqlDatabaseMetrics,   // SQL Database
  3: mockStorageAccountMetrics, // Storage Account
  4: mockApplicationInsightsMetrics // Application Insights
};

// Helper functions to extract specific metrics by resource ID
export const getCpuMetricData = (resourceId: number = 1) => {
  const metrics = resourceMetricsMap[resourceId] || mockAzureMetricsResponse;
  const cpuMetric = metrics.value.find(m => m.name.value === 'CpuPercentage');
  return cpuMetric?.timeseries[0]?.data || [];
};

export const getMemoryMetricData = (resourceId: number = 1) => {
  const metrics = resourceMetricsMap[resourceId] || mockAzureMetricsResponse;
  const memoryMetric = metrics.value.find(m => m.name.value === 'MemoryPercentage');
  return memoryMetric?.timeseries[0]?.data || [];
};

export const getRequestsMetricData = (resourceId: number = 1) => {
  const metrics = resourceMetricsMap[resourceId] || mockAzureMetricsResponse;
  const requestsMetric = metrics.value.find(m => 
    m.name.value === 'Requests' || m.name.value === 'requests/count'
  );
  return requestsMetric?.timeseries[0]?.data || [];
};

export const getResponseTimeMetricData = (resourceId: number = 1) => {
  const metrics = resourceMetricsMap[resourceId] || mockAzureMetricsResponse;
  const responseTimeMetric = metrics.value.find(m => m.name.value === 'AverageResponseTime');
  return responseTimeMetric?.timeseries[0]?.data || [];
};

export const getErrorsMetricData = (resourceId: number = 1) => {
  const metrics = resourceMetricsMap[resourceId] || mockAzureMetricsResponse;
  const errorsMetric = metrics.value.find(m => 
    m.name.value === 'Http4xx' || m.name.value === 'exceptions/count'
  );
  return errorsMetric?.timeseries[0]?.data || [];
};

export const getBandwidthMetricData = (resourceId: number = 1) => {
  const metrics = resourceMetricsMap[resourceId] || mockAzureMetricsResponse;
  const dataInMetric = metrics.value.find(m => m.name.value === 'BytesReceived');
  const dataOutMetric = metrics.value.find(m => m.name.value === 'BytesSent');
  return {
    dataIn: dataInMetric?.timeseries[0]?.data || [],
    dataOut: dataOutMetric?.timeseries[0]?.data || []
  };
};

// Resource-specific metric helpers
export const getDtuMetricData = (resourceId: number = 2) => {
  const metrics = resourceMetricsMap[resourceId];
  const dtuMetric = metrics?.value.find(m => m.name.value === 'dtu_consumption_percent');
  return dtuMetric?.timeseries[0]?.data || [];
};

export const getStorageMetricData = (resourceId: number = 2) => {
  const metrics = resourceMetricsMap[resourceId];
  const storageMetric = metrics?.value.find(m => 
    m.name.value === 'storage_percent' || m.name.value === 'UsedCapacity'
  );
  return storageMetric?.timeseries[0]?.data || [];
};

export const getTransactionsMetricData = (resourceId: number = 3) => {
  const metrics = resourceMetricsMap[resourceId];
  const transactionsMetric = metrics?.value.find(m => m.name.value === 'Transactions');
  return transactionsMetric?.timeseries[0]?.data || [];
};

export const getExceptionsMetricData = (resourceId: number = 4) => {
  const metrics = resourceMetricsMap[resourceId];
  const exceptionsMetric = metrics?.value.find(m => m.name.value === 'exceptions/count');
  return exceptionsMetric?.timeseries[0]?.data || [];
};

// Get metrics response for specific resource
export const getResourceMetrics = (resourceId: number): AzureMetricsResponse => {
  return resourceMetricsMap[resourceId] || mockAzureMetricsResponse;
};

// Format helpers for display
export const formatBytes = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatResponseTime = (seconds: number): string => {
  return `${Math.round(seconds * 1000)}ms`;
};