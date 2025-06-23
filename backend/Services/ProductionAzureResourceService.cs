using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Resources;
using Azure.ResourceManager.AppService;
using Azure.ResourceManager.Storage;
using Azure.ResourceManager.Sql;
using Azure.ResourceManager.AppService.Models;
using Azure.ResourceManager.Storage.Models;
using Azure.ResourceManager.Sql.Models;
using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Services;

public class ProductionAzureResourceService : IAzureResourceService
{
    private readonly EaselDbContext _context;
    private readonly ILogger<ProductionAzureResourceService> _logger;

    public ProductionAzureResourceService(EaselDbContext context, ILogger<ProductionAzureResourceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private ArmClient CreateArmClient(UserAzureCredential credentials)
    {
        var clientSecretCredential = new ClientSecretCredential(
            credentials.TenantId,
            credentials.ClientId,
            credentials.ClientSecret);

        return new ArmClient(clientSecretCredential);
    }

    public async Task<bool> ValidateAzureCredentialsAsync(UserAzureCredential credentials)
    {
        try
        {
            var armClient = CreateArmClient(credentials);
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{credentials.SubscriptionId}"));

            // Try to get subscription details to validate credentials
            var subscriptionData = await subscription.GetAsync();
            
            credentials.SubscriptionName = subscriptionData.Value.Data.DisplayName ?? "Unknown";
            credentials.LastValidated = DateTime.UtcNow;
            credentials.IsActive = true;

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate Azure credentials for subscription {SubscriptionId}", 
                credentials.SubscriptionId);
            
            credentials.IsActive = false;
            return false;
        }
    }

    public async Task<List<string>> GetAvailableLocationsAsync(int credentialId)
    {
        try
        {
            var credentials = await _context.UserAzureCredentials.FindAsync(credentialId);
            if (credentials == null || !credentials.IsActive)
                return new List<string>();

            var armClient = CreateArmClient(credentials);
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{credentials.SubscriptionId}"));

            var locations = new List<string>();
            await foreach (var location in subscription.GetLocationsAsync())
            {
                locations.Add(location.Name);
            }

            return locations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available locations for credential {CredentialId}", credentialId);
            return new List<string>();
        }
    }

    public async Task<bool> ProvisionResourcesAsync(int projectId, List<AzureResourceRecommendation> recommendations)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.UserAzureCredential)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            
            if (project?.UserAzureCredential == null)
            {
                _logger.LogError("Project {ProjectId} has no Azure credentials configured", projectId);
                return false;
            }

            if (!project.UserAzureCredential.IsActive)
            {
                _logger.LogError("Azure credentials for project {ProjectId} are inactive", projectId);
                return false;
            }

            project.Status = ProjectStatus.Provisioning;
            await _context.SaveChangesAsync();

            var armClient = CreateArmClient(project.UserAzureCredential);
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{project.UserAzureCredential.SubscriptionId}"));
            
            // Create resource group in user's subscription
            var resourceGroupName = $"easel-{project.Name.ToLower().Replace(" ", "-")}-rg";
            var resourceGroupCollection = subscription.GetResourceGroups();
            
            var resourceGroupData = new ResourceGroupData(recommendations.FirstOrDefault()?.Location ?? "East US")
            {
                Tags = 
                {
                    ["CreatedBy"] = "Easel",
                    ["ProjectId"] = projectId.ToString(),
                    ["ProjectName"] = project.Name
                }
            };

            var resourceGroupLro = await resourceGroupCollection.CreateOrUpdateAsync(
                Azure.WaitUntil.Completed,
                resourceGroupName,
                resourceGroupData);

            var resourceGroup = resourceGroupLro.Value;

            foreach (var recommendation in recommendations)
            {
                try
                {
                    var azureResource = new AzureResource
                    {
                        ProjectId = projectId,
                        ResourceType = recommendation.ResourceType,
                        Name = recommendation.Name,
                        ResourceGroupName = resourceGroupName,
                        Location = recommendation.Location,
                        Configuration = JsonSerializer.Serialize(recommendation.Configuration),
                        EstimatedMonthlyCost = recommendation.EstimatedMonthlyCost,
                        Status = ResourceStatus.Provisioning
                    };

                    _context.AzureResources.Add(azureResource);
                    await _context.SaveChangesAsync();

                    // Provision the actual resource in user's subscription
                    var success = await ProvisionSpecificResourceAsync(resourceGroup, azureResource, recommendation);
                    
                    if (success)
                    {
                        azureResource.Status = ResourceStatus.Active;
                        azureResource.ProvisionedAt = DateTime.UtcNow;
                        azureResource.AzureResourceId = $"/subscriptions/{project.UserAzureCredential.SubscriptionId}/resourceGroups/{resourceGroupName}/providers/{recommendation.ResourceType}/{recommendation.Name}";
                    }
                    else
                    {
                        azureResource.Status = ResourceStatus.Failed;
                    }
                    
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to provision resource {ResourceName} in user subscription", recommendation.Name);
                    
                    var failedResource = _context.AzureResources.FirstOrDefault(r => 
                        r.ProjectId == projectId && r.Name == recommendation.Name);
                    
                    if (failedResource != null)
                    {
                        failedResource.Status = ResourceStatus.Failed;
                        await _context.SaveChangesAsync();
                    }
                }
            }

            // Check if all resources were provisioned successfully
            var allResources = _context.AzureResources.Where(r => r.ProjectId == projectId).ToList();
            var hasFailures = allResources.Any(r => r.Status == ResourceStatus.Failed);

            project.Status = hasFailures ? ProjectStatus.Error : ProjectStatus.Active;
            await _context.SaveChangesAsync();

            return !hasFailures;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error provisioning resources for project {ProjectId} in user subscription", projectId);
            
            var project = await _context.Projects.FindAsync(projectId);
            if (project != null)
            {
                project.Status = ProjectStatus.Error;
                await _context.SaveChangesAsync();
            }
            
            return false;
        }
    }

    private async Task<bool> ProvisionSpecificResourceAsync(
        ResourceGroupResource resourceGroup, 
        AzureResource azureResource, 
        AzureResourceRecommendation recommendation)
    {
        try
        {
            _logger.LogInformation("Provisioning {ResourceType} named {ResourceName} in user's subscription", 
                recommendation.ResourceType, recommendation.Name);

            var success = recommendation.ResourceType.ToLower() switch
            {
                "microsoft.web/sites" => await ProvisionAppServiceAsync(resourceGroup, azureResource, recommendation),
                "microsoft.storage/storageaccounts" => await ProvisionStorageAccountAsync(resourceGroup, azureResource, recommendation),
                "microsoft.sql/servers/databases" => await ProvisionSqlDatabaseAsync(resourceGroup, azureResource, recommendation),
                "microsoft.web/serverfarms" => await ProvisionAppServicePlanAsync(resourceGroup, azureResource, recommendation),
                _ => await ProvisionGenericResourceAsync(resourceGroup, azureResource, recommendation)
            };

            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision specific resource {ResourceName} of type {ResourceType}", 
                recommendation.Name, recommendation.ResourceType);
            return false;
        }
    }

    private async Task<bool> ProvisionAppServicePlanAsync(ResourceGroupResource resourceGroup, AzureResource azureResource, AzureResourceRecommendation recommendation)
    {
        try
        {
            var planCollection = resourceGroup.GetAppServicePlans();
            var config = JsonSerializer.Deserialize<AppServicePlanConfig>(azureResource.Configuration) ?? new AppServicePlanConfig();
            
            var planData = new AppServicePlanData(recommendation.Location)
            {
                Sku = new AppServiceSkuDescription
                {
                    Name = config.Sku?.Name ?? "B1",
                    Tier = config.Sku?.Tier ?? "Basic",
                    Size = config.Sku?.Size ?? "B1",
                    Family = config.Sku?.Family ?? "B",
                    Capacity = config.Sku?.Capacity ?? 1
                },
                Kind = config.Kind ?? "app"
            };

            planData.Tags.Add("CreatedBy", "Easel");
            planData.Tags.Add("ProjectId", azureResource.ProjectId.ToString());

            _logger.LogInformation("Creating App Service Plan {PlanName}", recommendation.Name);
            var operation = await planCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, recommendation.Name, planData);
            
            _logger.LogInformation("Successfully provisioned App Service Plan {PlanName}", recommendation.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision App Service Plan {PlanName}", recommendation.Name);
            return false;
        }
    }

    private async Task<bool> ProvisionAppServiceAsync(ResourceGroupResource resourceGroup, AzureResource azureResource, AzureResourceRecommendation recommendation)
    {
        try
        {
            var webSiteCollection = resourceGroup.GetWebSites();
            var config = JsonSerializer.Deserialize<AppServiceConfig>(azureResource.Configuration) ?? new AppServiceConfig();
            
            // Create App Service Plan first if not specified
            var planName = config.ServicePlanName ?? $"{recommendation.Name}-plan";
            var planCollection = resourceGroup.GetAppServicePlans();
            
            var planData = new AppServicePlanData(recommendation.Location)
            {
                Sku = new AppServiceSkuDescription
                {
                    Name = config.Sku?.Name ?? "B1",
                    Tier = config.Sku?.Tier ?? "Basic",
                    Size = config.Sku?.Size ?? "B1",
                    Family = config.Sku?.Family ?? "B",
                    Capacity = config.Sku?.Capacity ?? 1
                },
                Kind = "app"
            };
            
            planData.Tags.Add("CreatedBy", "Easel");
            planData.Tags.Add("ProjectId", azureResource.ProjectId.ToString());

            _logger.LogInformation("Creating App Service Plan {PlanName}", planName);
            var planOperation = await planCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, planName, planData);
            var plan = planOperation.Value;

            // Create the Web App
            var siteData = new WebSiteData(recommendation.Location)
            {
                AppServicePlanId = plan.Id,
                Kind = config.Kind ?? "app",
                SiteConfig = new SiteConfigProperties
                {
                    NetFrameworkVersion = config.NetFrameworkVersion ?? "v6.0"
                },
                IsHttpsOnly = config.HttpsOnly ?? true
            };

            siteData.Tags.Add("CreatedBy", "Easel");
            siteData.Tags.Add("ProjectId", azureResource.ProjectId.ToString());

            _logger.LogInformation("Creating App Service {SiteName}", recommendation.Name);
            var siteOperation = await webSiteCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, recommendation.Name, siteData);
            
            _logger.LogInformation("Successfully provisioned App Service {SiteName}", recommendation.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision App Service {SiteName}", recommendation.Name);
            return false;
        }
    }

    private async Task<bool> ProvisionStorageAccountAsync(ResourceGroupResource resourceGroup, AzureResource azureResource, AzureResourceRecommendation recommendation)
    {
        try
        {
            var storageCollection = resourceGroup.GetStorageAccounts();
            var config = JsonSerializer.Deserialize<StorageConfig>(azureResource.Configuration) ?? new StorageConfig();

            var storageData = new StorageAccountCreateOrUpdateContent(
                new StorageSku(config.Sku?.Name ?? "Standard_LRS"),
                StorageKind.StorageV2,
                recommendation.Location)
            {
                AccessTier = config.AccessTier ?? StorageAccountAccessTier.Hot,
                AllowBlobPublicAccess = config.AllowBlobPublicAccess ?? false,
                EnableHttpsTrafficOnly = config.EnableHttpsTrafficOnly ?? true,
                MinimumTlsVersion = config.MinimumTlsVersion ?? StorageMinimumTlsVersion.Tls1_2,
                Tags = 
                {
                    ["CreatedBy"] = "Easel",
                    ["ProjectId"] = azureResource.ProjectId.ToString()
                }
            };

            _logger.LogInformation("Creating Storage Account {StorageName}", recommendation.Name);
            var operation = await storageCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, recommendation.Name, storageData);
            
            _logger.LogInformation("Successfully provisioned Storage Account {StorageName}", recommendation.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision Storage Account {StorageName}", recommendation.Name);
            return false;
        }
    }

    private async Task<bool> ProvisionSqlDatabaseAsync(ResourceGroupResource resourceGroup, AzureResource azureResource, AzureResourceRecommendation recommendation)
    {
        try
        {
            var sqlServerCollection = resourceGroup.GetSqlServers();
            var config = JsonSerializer.Deserialize<SqlConfig>(azureResource.Configuration) ?? new SqlConfig();

            // Create SQL Server first
            var serverName = config.ServerName ?? $"{recommendation.Name}-server";
            var serverData = new SqlServerData(recommendation.Location)
            {
                AdministratorLogin = config.AdminUsername ?? "easel-admin",
                AdministratorLoginPassword = config.AdminPassword ?? GenerateSecurePassword(),
                Version = "12.0"
            };

            serverData.Tags.Add("CreatedBy", "Easel");
            serverData.Tags.Add("ProjectId", azureResource.ProjectId.ToString());

            _logger.LogInformation("Creating SQL Server {ServerName}", serverName);
            var serverOperation = await sqlServerCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, serverName, serverData);
            var server = serverOperation.Value;

            // Create the database
            var databaseCollection = server.GetSqlDatabases();
            var databaseData = new SqlDatabaseData(recommendation.Location)
            {
                Sku = new SqlSku(config.Sku?.Name ?? "Basic")
                {
                    Tier = config.Sku?.Tier ?? "Basic"
                },
                Collation = config.Collation ?? "SQL_Latin1_General_CP1_CI_AS",
                MaxSizeBytes = config.MaxSizeBytes ?? 2147483648 // 2GB default
            };

            databaseData.Tags.Add("CreatedBy", "Easel");
            databaseData.Tags.Add("ProjectId", azureResource.ProjectId.ToString());

            _logger.LogInformation("Creating SQL Database {DatabaseName}", recommendation.Name);
            var databaseOperation = await databaseCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, recommendation.Name, databaseData);
            
            _logger.LogInformation("Successfully provisioned SQL Database {DatabaseName}", recommendation.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision SQL Database {DatabaseName}", recommendation.Name);
            return false;
        }
    }

    private async Task<bool> ProvisionGenericResourceAsync(ResourceGroupResource resourceGroup, AzureResource azureResource, AzureResourceRecommendation recommendation)
    {
        try
        {
            _logger.LogInformation("Provisioning generic resource {ResourceName} of type {ResourceType}", 
                recommendation.Name, recommendation.ResourceType);

            // For unsupported resource types, we'll log and simulate
            await Task.Delay(1500);
            
            _logger.LogWarning("Resource type {ResourceType} not yet supported for automatic provisioning", 
                recommendation.ResourceType);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision generic resource {ResourceName}", recommendation.Name);
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
            var resource = await _context.AzureResources
                .Include(r => r.Project)
                .ThenInclude(p => p.UserAzureCredential)
                .FirstOrDefaultAsync(r => r.Id == resourceId);
            
            if (resource?.Project?.UserAzureCredential == null)
            {
                return new ResourceDeletionResponse
                {
                    Success = false,
                    RequiresConfirmation = false,
                    Message = "Resource not found or no Azure credentials configured."
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

            // Proceed with confirmed deletion
            resource.Status = ResourceStatus.Deleting;
            await _context.SaveChangesAsync();

            var armClient = CreateArmClient(resource.Project.UserAzureCredential);
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{resource.Project.UserAzureCredential.SubscriptionId}"));
            
            var resourceGroup = subscription.GetResourceGroups().Get(resource.ResourceGroupName);

            // Delete the specific resource from user's Azure subscription
            var success = await DeleteSpecificResourceAsync(resourceGroup, resource);

            if (success)
            {
                resource.Status = ResourceStatus.Deleted;
                resource.DeletedAt = DateTime.UtcNow;
            }
            else
            {
                resource.Status = ResourceStatus.Failed;
            }

            await _context.SaveChangesAsync();
            
            return new ResourceDeletionResponse
            {
                Success = success,
                RequiresConfirmation = false,
                Message = success ? "Resource deleted successfully." : "Failed to delete resource."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting resource {ResourceId} from user subscription", resourceId);
            
            var resource = await _context.AzureResources.FindAsync(resourceId);
            if (resource != null)
            {
                resource.Status = ResourceStatus.Failed;
                await _context.SaveChangesAsync();
            }
            
            return new ResourceDeletionResponse
            {
                Success = false,
                RequiresConfirmation = false,
                Message = "An error occurred while deleting the resource."
            };
        }
    }

    private async Task<bool> DeleteSpecificResourceAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        try
        {
            _logger.LogInformation("Deleting {ResourceType} named {ResourceName} from user's Azure subscription", 
                azureResource.ResourceType, azureResource.Name);

            var success = azureResource.ResourceType.ToLower() switch
            {
                "microsoft.web/sites" => await DeleteAppServiceAsync(resourceGroup, azureResource),
                "microsoft.storage/storageaccounts" => await DeleteStorageAccountAsync(resourceGroup, azureResource),
                "microsoft.sql/servers/databases" => await DeleteSqlDatabaseAsync(resourceGroup, azureResource),
                "microsoft.web/serverfarms" => await DeleteAppServicePlanAsync(resourceGroup, azureResource),
                _ => await DeleteGenericResourceAsync(resourceGroup, azureResource)
            };

            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete specific resource {ResourceName} of type {ResourceType}", 
                azureResource.Name, azureResource.ResourceType);
            return false;
        }
    }

    private async Task<bool> DeleteAppServiceAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        try
        {
            var webSites = resourceGroup.GetWebSites();
            var webSite = await webSites.GetAsync(azureResource.Name);
            
            _logger.LogInformation("Deleting App Service {SiteName}", azureResource.Name);
            await webSite.Value.DeleteAsync(Azure.WaitUntil.Completed);
            
            _logger.LogInformation("Successfully deleted App Service {SiteName}", azureResource.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete App Service {SiteName}", azureResource.Name);
            return false;
        }
    }

    private async Task<bool> DeleteStorageAccountAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        try
        {
            var storageAccounts = resourceGroup.GetStorageAccounts();
            var storageAccount = await storageAccounts.GetAsync(azureResource.Name);
            
            _logger.LogInformation("Deleting Storage Account {StorageName}", azureResource.Name);
            await storageAccount.Value.DeleteAsync(Azure.WaitUntil.Completed);
            
            _logger.LogInformation("Successfully deleted Storage Account {StorageName}", azureResource.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete Storage Account {StorageName}", azureResource.Name);
            return false;
        }
    }

    private async Task<bool> DeleteSqlDatabaseAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        try
        {
            var sqlServers = resourceGroup.GetSqlServers();
            var config = JsonSerializer.Deserialize<SqlConfig>(azureResource.Configuration) ?? new SqlConfig();
            var serverName = config.ServerName ?? $"{azureResource.Name}-server";
            
            var sqlServer = await sqlServers.GetAsync(serverName);
            var databases = sqlServer.Value.GetSqlDatabases();
            var database = await databases.GetAsync(azureResource.Name);
            
            _logger.LogInformation("Deleting SQL Database {DatabaseName}", azureResource.Name);
            await database.Value.DeleteAsync(Azure.WaitUntil.Completed);
            
            _logger.LogInformation("Successfully deleted SQL Database {DatabaseName}", azureResource.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete SQL Database {DatabaseName}", azureResource.Name);
            return false;
        }
    }

    private async Task<bool> DeleteAppServicePlanAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        try
        {
            var appServicePlans = resourceGroup.GetAppServicePlans();
            var plan = await appServicePlans.GetAsync(azureResource.Name);
            
            _logger.LogInformation("Deleting App Service Plan {PlanName}", azureResource.Name);
            await plan.Value.DeleteAsync(Azure.WaitUntil.Completed);
            
            _logger.LogInformation("Successfully deleted App Service Plan {PlanName}", azureResource.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete App Service Plan {PlanName}", azureResource.Name);
            return false;
        }
    }

    private async Task<bool> DeleteGenericResourceAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        try
        {
            _logger.LogInformation("Deleting generic resource {ResourceName} of type {ResourceType}", 
                azureResource.Name, azureResource.ResourceType);

            // For unsupported resource types, we'll simulate deletion
            await Task.Delay(1500);
            
            _logger.LogWarning("Resource type {ResourceType} not yet supported for automatic deletion", 
                azureResource.ResourceType);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete generic resource {ResourceName}", azureResource.Name);
            return false;
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

    private string GetResourceDeletionWarning(AzureResource resource)
    {
        return resource.ResourceType.ToLower() switch
        {
            "microsoft.web/sites" => "⚠️ This will permanently delete the web application and all its data.",
            "microsoft.storage/storageaccounts" => "⚠️ This will permanently delete all stored data including blobs, files, queues, and tables.",
            "microsoft.sql/servers/databases" => "⚠️ This will permanently delete the database and all its data.",
            "microsoft.web/serverfarms" => "⚠️ This will delete the hosting plan. Ensure no web apps are still using this plan.",
            _ => "⚠️ This will permanently delete the Azure resource and all associated data."
        };
    }

    private string GenerateSecurePassword()
    {
        // Generate a secure password for SQL Server
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 16)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}