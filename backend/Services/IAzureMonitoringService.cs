using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IAzureMonitoringService
{
    Task<List<ResourceMetric>> GetResourceMetricsAsync(int projectId);
    Task<decimal> GetProjectCostAsync(int projectId, DateTime startDate, DateTime endDate);
    Task<List<ResourceUsageData>> GetResourceUsageAsync(int projectId, string timeRange = "last30days");
    Task UpdateResourceMetricsAsync(int projectId);
}

public class ResourceUsageData
{
    public int ResourceId { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public Dictionary<string, double> UsageMetrics { get; set; } = new();
    public decimal CostToDate { get; set; }
    public string TimeRange { get; set; } = string.Empty;
}

public class AzureMonitoringService : IAzureMonitoringService
{
    private readonly EaselDbContext _context;
    private readonly ILogger<AzureMonitoringService> _logger;

    public AzureMonitoringService(EaselDbContext context, ILogger<AzureMonitoringService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<ResourceMetric>> GetResourceMetricsAsync(int projectId)
    {
        try
        {
            return await _context.ResourceMetrics
                .Where(m => m.AzureResourceId == projectId) // Using project ID for now
                .OrderByDescending(m => m.Timestamp)
                .Take(100)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resource metrics for project {ProjectId}", projectId);
            return new List<ResourceMetric>();
        }
    }

    public async Task<decimal> GetProjectCostAsync(int projectId, DateTime startDate, DateTime endDate)
    {
        try
        {
            var resources = await _context.AzureResources
                .Where(r => r.ProjectId == projectId && r.Status == ResourceStatus.Active)
                .ToListAsync();

            // Calculate prorated estimated costs for the date range
            var estimatedMonthlyCost = resources.Sum(r => r.EstimatedMonthlyCost);
            var totalDays = (endDate - startDate).TotalDays;
            var dailyCost = estimatedMonthlyCost / 30;
            var totalCost = dailyCost * (decimal)totalDays;

            _logger.LogInformation("Calculated estimated cost ${Cost} for project {ProjectId} from {StartDate} to {EndDate}", 
                totalCost, projectId, startDate, endDate);

            return totalCost;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project cost for project {ProjectId}", projectId);
            return 0;
        }
    }

    public async Task<List<ResourceUsageData>> GetResourceUsageAsync(int projectId, string timeRange = "last30days")
    {
        try
        {
            var resources = await _context.AzureResources
                .Where(r => r.ProjectId == projectId && r.Status == ResourceStatus.Active)
                .ToListAsync();

            var usageData = new List<ResourceUsageData>();

            foreach (var resource in resources)
            {
                var usage = new ResourceUsageData
                {
                    ResourceId = resource.Id,
                    ResourceName = resource.Name,
                    ResourceType = GetResourceTypeName(resource.ResourceType),
                    UsageMetrics = GenerateMetricsForResource(resource.ResourceType),
                    CostToDate = resource.EstimatedMonthlyCost * 0.8m, // Simulate 80% of estimated cost
                    TimeRange = timeRange
                };

                usageData.Add(usage);
            }

            _logger.LogInformation("Retrieved usage data for {Count} resources in project {ProjectId}", 
                usageData.Count, projectId);

            return usageData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resource usage for project {ProjectId}", projectId);
            return new List<ResourceUsageData>();
        }
    }

    public async Task UpdateResourceMetricsAsync(int projectId)
    {
        try
        {
            var resources = await _context.AzureResources
                .Where(r => r.ProjectId == projectId && r.Status == ResourceStatus.Active)
                .ToListAsync();

            var metrics = new List<ResourceMetric>();

            foreach (var resource in resources)
            {
                // Generate sample metrics for demonstration
                // TODO: Replace with real Azure Monitor API calls
                var resourceMetrics = GenerateMetricsForResource(resource.ResourceType);

                foreach (var metric in resourceMetrics)
                {
                    metrics.Add(new ResourceMetric
                    {
                        AzureResourceId = resource.Id,
                        MetricName = metric.Key,
                        Value = metric.Value,
                        Unit = GetMetricUnit(metric.Key),
                        Timestamp = DateTime.UtcNow
                    });
                }
            }

            if (metrics.Any())
            {
                _context.ResourceMetrics.AddRange(metrics);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Updated {Count} metrics for {ResourceCount} resources in project {ProjectId}", 
                    metrics.Count, resources.Count, projectId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating resource metrics for project {ProjectId}", projectId);
        }
    }

    private string GetResourceTypeName(string resourceType)
    {
        return resourceType.ToLower() switch
        {
            "microsoft.web/sites" => "App Service",
            "microsoft.storage/storageaccounts" => "Storage Account",
            "microsoft.sql/servers/databases" => "SQL Database",
            "microsoft.web/serverfarms" => "App Service Plan",
            _ => "Azure Resource"
        };
    }

    private Dictionary<string, double> GenerateMetricsForResource(string resourceType)
    {
        return resourceType.ToLower() switch
        {
            "microsoft.web/sites" => new Dictionary<string, double>
            {
                ["CPU Percentage"] = Random.Shared.NextDouble() * 100,
                ["Memory Percentage"] = Random.Shared.NextDouble() * 100,
                ["Requests/Sec"] = Random.Shared.NextDouble() * 50,
                ["Response Time"] = Random.Shared.NextDouble() * 1000
            },
            "microsoft.storage/storageaccounts" => new Dictionary<string, double>
            {
                ["Used Capacity"] = Random.Shared.NextDouble() * 1000,
                ["Transactions"] = Random.Shared.NextDouble() * 10000,
                ["Ingress"] = Random.Shared.NextDouble() * 100,
                ["Egress"] = Random.Shared.NextDouble() * 100
            },
            "microsoft.sql/servers/databases" => new Dictionary<string, double>
            {
                ["DTU Percentage"] = Random.Shared.NextDouble() * 100,
                ["Storage Percentage"] = Random.Shared.NextDouble() * 100,
                ["Connections"] = Random.Shared.NextDouble() * 50,
                ["Deadlocks"] = Random.Shared.NextDouble() * 5
            },
            _ => new Dictionary<string, double>
            {
                ["Usage"] = Random.Shared.NextDouble() * 100
            }
        };
    }

    private string GetMetricUnit(string metricName)
    {
        return metricName.ToLower() switch
        {
            var name when name.Contains("percentage") || name.Contains("percent") => "Percent",
            var name when name.Contains("bytes") || name.Contains("capacity") => "Bytes",
            var name when name.Contains("requests") || name.Contains("transactions") => "Count",
            var name when name.Contains("latency") || name.Contains("time") => "Milliseconds",
            _ => "Count"
        };
    }
}