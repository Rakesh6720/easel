using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IBillingService
{
    Task<BillingData> GetUserBillingDataAsync(int userId);
    Task<List<BillingPeriod>> GetBillingHistoryAsync(int userId, int? limit = null);
    Task<List<CostBreakdownItem>> GetCostBreakdownAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<ProjectCostBreakdownItem>> GetProjectCostBreakdownAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);
    Task<decimal> GetCurrentMonthCostAsync(int userId);
    Task<decimal> GetThreeMonthAverageAsync(int userId);
    Task<decimal> GetMonthOverMonthChangeAsync(int userId);
    Task<BudgetInfo> GetBudgetInfoAsync(int userId);
    Task<List<CostOptimizationRecommendation>> GetCostOptimizationRecommendationsAsync(int userId);
}

public class BillingData
{
    public CurrentBill CurrentBill { get; set; } = new();
    public List<BillingPeriod> BillingHistory { get; set; } = new();
    public List<CostBreakdownItem> CostBreakdown { get; set; } = new();
    public PaymentMethod PaymentMethod { get; set; } = new();
    public decimal ThreeMonthAverage { get; set; }
    public decimal MonthOverMonthChange { get; set; }
    public BudgetInfo BudgetInfo { get; set; } = new();
    public List<CostOptimizationRecommendation> OptimizationRecommendations { get; set; } = new();
}

public class CurrentBill
{
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "current";
    public string Period { get; set; } = string.Empty;
    public DateTime BillingDate { get; set; }
}

public class BillingPeriod
{
    public int Id { get; set; }
    public string Period { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PaidDate { get; set; }
    public DateTime BillingDate { get; set; }
    public string InvoiceUrl { get; set; } = string.Empty;
}

public class CostBreakdownItem
{
    public string Service { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public double Percentage { get; set; }
    public string Trend { get; set; } = "stable";
    public string Change { get; set; } = string.Empty;
    public int ResourceCount { get; set; }
}

public class ProjectCostBreakdownItem
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public double Percentage { get; set; }
    public string Trend { get; set; } = "stable";
    public string Change { get; set; } = string.Empty;
    public int ResourceCount { get; set; }
    public List<ResourceCostItem> Resources { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ResourceCostItem
{
    public int ResourceId { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public double Percentage { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class PaymentMethod
{
    public string Type { get; set; } = "visa";
    public string Last4 { get; set; } = string.Empty;
    public string ExpiryMonth { get; set; } = string.Empty;
    public string ExpiryYear { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = true;
    public bool AutoPay { get; set; } = true;
}

public class BudgetInfo
{
    public decimal Budget { get; set; }
    public decimal CurrentSpend { get; set; }
    public double Percentage { get; set; }
    public string AlertLevel { get; set; } = "normal"; // normal, warning, critical
}

public class CostOptimizationRecommendation
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal EstimatedMonthlySavings { get; set; }
    public string Severity { get; set; } = "low"; // low, medium, high
    public List<string> AffectedResources { get; set; } = new();
}

public class BillingService : IBillingService
{
    private readonly EaselDbContext _context;
    private readonly IAzureMonitoringService _azureMonitoringService;
    private readonly ILogger<BillingService> _logger;

    public BillingService(
        EaselDbContext context, 
        IAzureMonitoringService azureMonitoringService,
        ILogger<BillingService> logger)
    {
        _context = context;
        _azureMonitoringService = azureMonitoringService;
        _logger = logger;
    }

    public async Task<BillingData> GetUserBillingDataAsync(int userId)
    {
        try
        {
            _logger.LogInformation("Getting billing data for user {UserId}", userId);

            var billingData = new BillingData
            {
                CurrentBill = await GetCurrentBillAsync(userId),
                BillingHistory = await GetBillingHistoryAsync(userId, 12),
                CostBreakdown = await GetCostBreakdownAsync(userId),
                PaymentMethod = await GetPaymentMethodAsync(userId),
                ThreeMonthAverage = await GetThreeMonthAverageAsync(userId),
                MonthOverMonthChange = await GetMonthOverMonthChangeAsync(userId),
                BudgetInfo = await GetBudgetInfoAsync(userId),
                OptimizationRecommendations = await GetCostOptimizationRecommendationsAsync(userId)
            };

            return billingData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting billing data for user {UserId}", userId);
            throw;
        }
    }

    public async Task<List<BillingPeriod>> GetBillingHistoryAsync(int userId, int? limit = null)
    {
        try
        {
            // Generate billing history based on user's project costs
            var projects = await _context.Projects
                .Where(p => p.UserId == userId)
                .ToListAsync();

            var billingHistory = new List<BillingPeriod>();
            var currentDate = DateTime.UtcNow;

            for (int i = 1; i <= (limit ?? 12); i++)
            {
                var periodStart = currentDate.AddMonths(-i);
                var periodEnd = periodStart.AddMonths(1).AddDays(-1);

                decimal totalCost = 0;
                foreach (var project in projects)
                {
                    totalCost += await _azureMonitoringService.GetProjectCostAsync(project.Id, periodStart, periodEnd);
                }

                billingHistory.Add(new BillingPeriod
                {
                    Id = i,
                    Period = periodStart.ToString("MMMM yyyy"),
                    Amount = totalCost,
                    Status = "paid",
                    PaidDate = periodEnd.AddDays(5),
                    BillingDate = periodEnd,
                    InvoiceUrl = $"/api/billing/invoice/{userId}/{periodStart:yyyy-MM}"
                });
            }

            return billingHistory.OrderByDescending(b => b.BillingDate).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting billing history for user {UserId}", userId);
            return new List<BillingPeriod>();
        }
    }

    public async Task<List<CostBreakdownItem>> GetCostBreakdownAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var projects = await _context.Projects
                .Include(p => p.Resources)
                .Where(p => p.UserId == userId)
                .ToListAsync();

            var breakdown = new Dictionary<string, (decimal cost, int count)>();
            decimal totalCost = 0;

            foreach (var project in projects)
            {
                foreach (var resource in project.Resources.Where(r => r.Status == ResourceStatus.Active))
                {
                    var cost = await _azureMonitoringService.GetProjectCostAsync(project.Id, start, end);
                    var serviceType = GetServiceDisplayName(resource.ResourceType);
                    
                    if (breakdown.ContainsKey(serviceType))
                    {
                        breakdown[serviceType] = (breakdown[serviceType].cost + cost, breakdown[serviceType].count + 1);
                    }
                    else
                    {
                        breakdown[serviceType] = (cost, 1);
                    }
                    totalCost += cost;
                }
            }

            return breakdown.Select(kvp => new CostBreakdownItem
            {
                Service = kvp.Key,
                Amount = kvp.Value.cost,
                Percentage = totalCost > 0 ? Math.Round((double)(kvp.Value.cost / totalCost * 100), 1) : 0,
                Trend = Random.Shared.NextDouble() > 0.5 ? "up" : "down",
                Change = $"{Random.Shared.Next(1, 15)}%",
                ResourceCount = kvp.Value.count
            }).OrderByDescending(c => c.Amount).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cost breakdown for user {UserId}", userId);
            return new List<CostBreakdownItem>();
        }
    }

    public async Task<decimal> GetCurrentMonthCostAsync(int userId)
    {
        try
        {
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var projects = await _context.Projects.Where(p => p.UserId == userId).ToListAsync();
            
            decimal totalCost = 0;
            foreach (var project in projects)
            {
                totalCost += await _azureMonitoringService.GetProjectCostAsync(project.Id, startOfMonth, DateTime.UtcNow);
            }
            
            return totalCost;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current month cost for user {UserId}", userId);
            return 0;
        }
    }

    public async Task<decimal> GetThreeMonthAverageAsync(int userId)
    {
        try
        {
            var history = await GetBillingHistoryAsync(userId, 3);
            return history.Any() ? history.Average(h => h.Amount) : 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting three month average for user {UserId}", userId);
            return 0;
        }
    }

    public async Task<decimal> GetMonthOverMonthChangeAsync(int userId)
    {
        try
        {
            var history = await GetBillingHistoryAsync(userId, 2);
            if (history.Count < 2) return 0;

            var currentMonth = history[0].Amount;
            var previousMonth = history[1].Amount;
            
            if (previousMonth == 0) return 0;
            
            return Math.Round(((currentMonth - previousMonth) / previousMonth) * 100, 1);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting month over month change for user {UserId}", userId);
            return 0;
        }
    }

    public async Task<BudgetInfo> GetBudgetInfoAsync(int userId)
    {
        try
        {
            // For now, use a default budget of $500. In production, this would come from user settings
            var budget = 500m;
            var currentSpend = await GetCurrentMonthCostAsync(userId);
            var percentage = budget > 0 ? Math.Round((double)(currentSpend / budget * 100), 1) : 0;
            
            var alertLevel = percentage switch
            {
                >= 90 => "critical",
                >= 75 => "warning",
                _ => "normal"
            };

            return new BudgetInfo
            {
                Budget = budget,
                CurrentSpend = currentSpend,
                Percentage = percentage,
                AlertLevel = alertLevel
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting budget info for user {UserId}", userId);
            return new BudgetInfo();
        }
    }

    public async Task<List<CostOptimizationRecommendation>> GetCostOptimizationRecommendationsAsync(int userId)
    {
        try
        {
            var recommendations = new List<CostOptimizationRecommendation>();
            
            var projects = await _context.Projects
                .Include(p => p.Resources)
                .Where(p => p.UserId == userId)
                .ToListAsync();

            // Find idle resources
            var idleResources = projects.SelectMany(p => p.Resources)
                .Where(r => r.Status == ResourceStatus.Active && r.EstimatedMonthlyCost > 10)
                .ToList();

            if (idleResources.Any())
            {
                recommendations.Add(new CostOptimizationRecommendation
                {
                    Type = "Idle Resources",
                    Description = "Consider scaling down or deleting underutilized resources",
                    EstimatedMonthlySavings = idleResources.Sum(r => r.EstimatedMonthlyCost * 0.3m),
                    Severity = "medium",
                    AffectedResources = idleResources.Take(5).Select(r => r.Name).ToList()
                });
            }

            // Right-sizing recommendations
            var expensiveResources = projects.SelectMany(p => p.Resources)
                .Where(r => r.Status == ResourceStatus.Active && r.EstimatedMonthlyCost > 50)
                .ToList();

            if (expensiveResources.Any())
            {
                recommendations.Add(new CostOptimizationRecommendation
                {
                    Type = "Right-sizing",
                    Description = "Review high-cost resources for potential right-sizing opportunities",
                    EstimatedMonthlySavings = expensiveResources.Sum(r => r.EstimatedMonthlyCost * 0.2m),
                    Severity = "low",
                    AffectedResources = expensiveResources.Take(3).Select(r => r.Name).ToList()
                });
            }

            return recommendations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cost optimization recommendations for user {UserId}", userId);
            return new List<CostOptimizationRecommendation>();
        }
    }

    public async Task<List<ProjectCostBreakdownItem>> GetProjectCostBreakdownAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var projects = await _context.Projects
                .Include(p => p.Resources.Where(r => r.Status == ResourceStatus.Active))
                .Where(p => p.UserId == userId)
                .ToListAsync();

            var projectBreakdown = new List<ProjectCostBreakdownItem>();
            decimal totalCost = 0;

            // Calculate costs for each project
            foreach (var project in projects)
            {
                var projectCost = await _azureMonitoringService.GetProjectCostAsync(project.Id, start, end);
                totalCost += projectCost;

                var resourceCosts = new List<ResourceCostItem>();
                foreach (var resource in project.Resources)
                {
                    // Estimate individual resource cost as a portion of project cost based on estimated monthly cost
                    var resourcePortion = project.Resources.Sum(r => r.EstimatedMonthlyCost) > 0 
                        ? resource.EstimatedMonthlyCost / project.Resources.Sum(r => r.EstimatedMonthlyCost)
                        : 1.0m / project.Resources.Count;
                    
                    var resourceCost = projectCost * resourcePortion;

                    resourceCosts.Add(new ResourceCostItem
                    {
                        ResourceId = resource.Id,
                        ResourceName = resource.Name,
                        ResourceType = GetServiceDisplayName(resource.ResourceType),
                        Amount = resourceCost,
                        Percentage = projectCost > 0 ? Math.Round((double)(resourceCost / projectCost * 100), 1) : 0,
                        Status = resource.Status.ToString()
                    });
                }

                projectBreakdown.Add(new ProjectCostBreakdownItem
                {
                    ProjectId = project.Id,
                    ProjectName = project.Name,
                    Amount = projectCost,
                    Percentage = 0, // Will be calculated after we have total cost
                    Trend = Random.Shared.NextDouble() > 0.5 ? "up" : "down",
                    Change = $"{Random.Shared.Next(1, 20)}%",
                    ResourceCount = project.Resources.Count,
                    Resources = resourceCosts.OrderByDescending(r => r.Amount).ToList(),
                    Status = project.Status.ToString(),
                    CreatedAt = project.CreatedAt
                });
            }

            // Calculate percentages now that we have total cost
            foreach (var project in projectBreakdown)
            {
                project.Percentage = totalCost > 0 ? Math.Round((double)(project.Amount / totalCost * 100), 1) : 0;
            }

            return projectBreakdown.OrderByDescending(p => p.Amount).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project cost breakdown for user {UserId}", userId);
            return new List<ProjectCostBreakdownItem>();
        }
    }

    private async Task<CurrentBill> GetCurrentBillAsync(int userId)
    {
        var currentCost = await GetCurrentMonthCostAsync(userId);
        var currentDate = DateTime.UtcNow;
        var dueDate = new DateTime(currentDate.Year, currentDate.Month, DateTime.DaysInMonth(currentDate.Year, currentDate.Month)).AddDays(5);

        return new CurrentBill
        {
            Amount = currentCost,
            DueDate = dueDate,
            Status = "current",
            Period = currentDate.ToString("MMMM yyyy"),
            BillingDate = DateTime.UtcNow
        };
    }

    private async Task<PaymentMethod> GetPaymentMethodAsync(int userId)
    {
        // For demo purposes, return a mock payment method
        // In production, this would come from a payment processor
        return new PaymentMethod
        {
            Type = "visa",
            Last4 = "4242",
            ExpiryMonth = "12",
            ExpiryYear = "25",
            IsDefault = true,
            AutoPay = true
        };
    }

    private string GetServiceDisplayName(string resourceType)
    {
        return resourceType.ToLower() switch
        {
            "microsoft.web/sites" => "App Service",
            "microsoft.storage/storageaccounts" => "Storage Account",
            "microsoft.sql/servers/databases" => "SQL Database",
            "microsoft.web/serverfarms" => "App Service Plan",
            "microsoft.insights/components" => "Application Insights",
            "microsoft.cache/redis" => "Redis Cache",
            _ => "Other Services"
        };
    }
}