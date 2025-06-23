using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IAzureMonitoringService
{
    Task<List<ResourceMetric>> GetResourceMetricsAsync(int resourceId, DateTime? startTime = null, DateTime? endTime = null);
    Task<decimal> GetCurrentMonthlyCostAsync(int projectId);
    Task<Dictionary<string, object>> GetResourceUsageStatsAsync(int resourceId);
    Task UpdateResourceMetricsAsync();
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

    public async Task<List<ResourceMetric>> GetResourceMetricsAsync(int resourceId, DateTime? startTime = null, DateTime? endTime = null)
    {
        var query = _context.ResourceMetrics.Where(m => m.AzureResourceId == resourceId);
        
        if (startTime.HasValue)
            query = query.Where(m => m.Timestamp >= startTime.Value);
        
        if (endTime.HasValue)
            query = query.Where(m => m.Timestamp <= endTime.Value);

        return await query.OrderByDescending(m => m.Timestamp).ToListAsync();
    }

    public async Task<decimal> GetCurrentMonthlyCostAsync(int projectId)
    {
        var resources = await _context.AzureResources
            .Where(r => r.ProjectId == projectId && r.Status == ResourceStatus.Active)
            .ToListAsync();

        // In a real implementation, you would query Azure Cost Management API
        // For now, return estimated costs
        return resources.Sum(r => r.EstimatedMonthlyCost);
    }

    public async Task<Dictionary<string, object>> GetResourceUsageStatsAsync(int resourceId)
    {
        var resource = await _context.AzureResources.FindAsync(resourceId);
        if (resource == null)
            return new Dictionary<string, object>();

        var recentMetrics = await _context.ResourceMetrics
            .Where(m => m.AzureResourceId == resourceId && m.Timestamp >= DateTime.UtcNow.AddDays(-7))
            .ToListAsync();

        // Group metrics by name and calculate basic stats
        var stats = new Dictionary<string, object>();
        
        var metricGroups = recentMetrics.GroupBy(m => m.MetricName);
        foreach (var group in metricGroups)
        {
            var values = group.Select(m => m.Value).ToList();
            if (values.Any())
            {
                stats[group.Key] = new
                {
                    Current = values.Last(),
                    Average = values.Average(),
                    Maximum = values.Max(),
                    Minimum = values.Min(),
                    Unit = group.First().Unit
                };
            }
        }

        return stats;
    }

    public async Task UpdateResourceMetricsAsync()
    {
        try
        {
            var activeResources = await _context.AzureResources
                .Include(r => r.Project)
                .ThenInclude(p => p.UserAzureCredential)
                .Where(r => r.Status == ResourceStatus.Active)
                .ToListAsync();

            foreach (var resource in activeResources)
            {
                if (resource.Project?.UserAzureCredential == null) continue;

                // In a real implementation, you would use Azure Monitor SDK to fetch actual metrics
                // For now, we'll simulate some metrics
                await SimulateMetricsUpdateAsync(resource);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating resource metrics");
        }
    }

    private async Task SimulateMetricsUpdateAsync(AzureResource resource)
    {
        var random = new Random();
        var now = DateTime.UtcNow;

        // Simulate different metrics based on resource type
        var metrics = new List<ResourceMetric>();

        switch (resource.ResourceType.ToLower())
        {
            case "microsoft.web/sites":
                metrics.AddRange(new[]
                {
                    new ResourceMetric
                    {
                        AzureResourceId = resource.Id,
                        MetricName = "CpuPercentage",
                        Value = random.NextDouble() * 100,
                        Unit = "Percent",
                        Timestamp = now
                    },
                    new ResourceMetric
                    {
                        AzureResourceId = resource.Id,
                        MetricName = "MemoryPercentage",
                        Value = random.NextDouble() * 100,
                        Unit = "Percent",
                        Timestamp = now
                    },
                    new ResourceMetric
                    {
                        AzureResourceId = resource.Id,
                        MetricName = "Requests",
                        Value = random.Next(0, 1000),
                        Unit = "Count",
                        Timestamp = now
                    }
                });
                break;

            case "microsoft.storage/storageaccounts":
                metrics.AddRange(new[]
                {
                    new ResourceMetric
                    {
                        AzureResourceId = resource.Id,
                        MetricName = "UsedCapacity",
                        Value = random.NextDouble() * 1024 * 1024 * 1024, // GB
                        Unit = "Bytes",
                        Timestamp = now
                    },
                    new ResourceMetric
                    {
                        AzureResourceId = resource.Id,
                        MetricName = "Transactions",
                        Value = random.Next(0, 10000),
                        Unit = "Count",
                        Timestamp = now
                    }
                });
                break;

            case "microsoft.sql/servers/databases":
                metrics.AddRange(new[]
                {
                    new ResourceMetric
                    {
                        AzureResourceId = resource.Id,
                        MetricName = "CpuPercent",
                        Value = random.NextDouble() * 100,
                        Unit = "Percent",
                        Timestamp = now
                    },
                    new ResourceMetric
                    {
                        AzureResourceId = resource.Id,
                        MetricName = "DatabaseSizePercent",
                        Value = random.NextDouble() * 100,
                        Unit = "Percent",
                        Timestamp = now
                    }
                });
                break;
        }

        _context.ResourceMetrics.AddRange(metrics);
        await _context.SaveChangesAsync();
    }
}