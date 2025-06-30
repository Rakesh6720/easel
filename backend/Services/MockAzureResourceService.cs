using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Services;

public class MockAzureResourceService : IAzureResourceService
{
    private readonly EaselDbContext _context;
    private readonly ILogger<MockAzureResourceService> _logger;

    public MockAzureResourceService(EaselDbContext context, ILogger<MockAzureResourceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> ValidateAzureCredentialsAsync(UserAzureCredential credentials)
    {
        // Mock validation - always return true for testing
        await Task.Delay(500); // Simulate API call
        
        credentials.SubscriptionName = "Mock Subscription";
        credentials.LastValidated = DateTime.UtcNow;
        credentials.IsActive = true;
        
        return true;
    }

    public async Task<List<string>> GetAvailableLocationsAsync(int credentialId)
    {
        // Mock locations
        await Task.Delay(200);
        return new List<string> { "East US", "West US", "Central US", "West Europe", "East Asia" };
    }

    public async Task<bool> ProvisionResourcesAsync(int projectId, List<AzureResourceRecommendation> recommendations)
    {
        try
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return false;

            project.Status = ProjectStatus.Provisioning;
            await _context.SaveChangesAsync();

            foreach (var recommendation in recommendations)
            {
                var azureResource = new AzureResource
                {
                    ProjectId = projectId,
                    ResourceType = recommendation.ResourceType,
                    Name = recommendation.Name,
                    ResourceGroupName = $"easel-{project.Name.ToLower().Replace(" ", "-")}-rg",
                    Location = recommendation.Location,
                    Configuration = JsonSerializer.Serialize(recommendation.Configuration),
                    EstimatedMonthlyCost = recommendation.EstimatedMonthlyCost,
                    Status = ResourceStatus.Provisioning
                };

                _context.AzureResources.Add(azureResource);
                await _context.SaveChangesAsync();

                // Simulate provisioning time
                await Task.Delay(1000);

                azureResource.Status = ResourceStatus.Active;
                azureResource.ProvisionedAt = DateTime.UtcNow;
                azureResource.AzureResourceId = $"/subscriptions/mock-sub/resourceGroups/{azureResource.ResourceGroupName}/providers/{recommendation.ResourceType}/{recommendation.Name}";
                
                await _context.SaveChangesAsync();
            }

            project.Status = ProjectStatus.Active;
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error provisioning resources for project {ProjectId}", projectId);
            return false;
        }
    }

    public async Task<List<AzureResource>> GetProjectResourcesAsync(int projectId)
    {
        return await _context.AzureResources
            .Where(r => r.ProjectId == projectId)
            .ToListAsync();
    }

    public async Task<ResourceDeletionResponse> DeleteResourceAsync(int resourceId, bool confirmed = false)
    {
        try
        {
            var resource = await _context.AzureResources.FindAsync(resourceId);
            if (resource == null)
            {
                return new ResourceDeletionResponse
                {
                    Success = false,
                    RequiresConfirmation = false,
                    Message = "Resource not found."
                };
            }

            if (!confirmed)
            {
                return new ResourceDeletionResponse
                {
                    Success = false,
                    RequiresConfirmation = true,
                    Message = $"Are you sure you want to permanently delete the {GetResourceTypeName(resource.ResourceType)} '{resource.Name}'?",
                    Warning = GetResourceDeletionWarning(resource),
                    ResourceName = resource.Name,
                    ResourceType = GetResourceTypeName(resource.ResourceType)
                };
            }

            // Simulate deletion
            resource.Status = ResourceStatus.Deleting;
            await _context.SaveChangesAsync();
            
            await Task.Delay(1000);
            
            resource.Status = ResourceStatus.Deleted;
            await _context.SaveChangesAsync();

            return new ResourceDeletionResponse
            {
                Success = true,
                RequiresConfirmation = false,
                Message = "Resource deleted successfully."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting resource {ResourceId}", resourceId);
            return new ResourceDeletionResponse
            {
                Success = false,
                RequiresConfirmation = false,
                Message = "An error occurred while deleting the resource."
            };
        }
    }

    private string GetResourceTypeName(string resourceType)
    {
        return resourceType.ToLower() switch
        {
            "microsoft.web/sites" => "App Service",
            "microsoft.storage/storageaccounts" => "Storage Account",
            "microsoft.sql/servers/databases" => "SQL Database",
            "microsoft.insights/components" => "Application Insights",
            "microsoft.web/serverfarms" => "App Service Plan",
            "microsoft.cache/redis" => "Redis Cache",
            _ => "Azure Resource"
        };
    }

    private string GetResourceDeletionWarning(AzureResource resource)
    {
        return resource.ResourceType.ToLower() switch
        {
            "microsoft.web/sites" => "⚠️ This will permanently delete the web application and all its data.",
            "microsoft.storage/storageaccounts" => "⚠️ This will permanently delete all stored data including blobs, files, queues, and tables.",
            "microsoft.sql/servers/databases" => "⚠️ This will permanently delete the database and all its data.",
            _ => "⚠️ This will permanently delete the Azure resource and all associated data."
        };
    }

    public async Task<AzureRoleCheckResult> CheckSubscriptionRoleAsync(int credentialId)
    {
        // Mock role check - simulate successful Contributor role for testing
        await Task.Delay(300); // Simulate API call
        
        return new AzureRoleCheckResult
        {
            IsValid = true,
            HasContributorRole = true,
            Message = "Mock service principal has Contributor role on the subscription",
            AssignedRoles = new List<string> { "b24988ac-6180-42a0-ab88-20f7382dd24c" } // Contributor role ID
        };
    }
}

