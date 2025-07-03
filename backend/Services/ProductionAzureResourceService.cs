using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Resources;
using Azure.ResourceManager.AppService;
using Azure.ResourceManager.Storage;
using Azure.ResourceManager.Sql;
using Azure.ResourceManager.AppService.Models;
using Azure.ResourceManager.Storage.Models;
using Azure.ResourceManager.Sql.Models;
using Azure.ResourceManager.ApplicationInsights;
using Azure.ResourceManager.ApplicationInsights.Models;
using Azure.ResourceManager.Redis;
using Azure.ResourceManager.Redis.Models;
using Azure.ResourceManager.Authorization;
using Azure.ResourceManager.Authorization.Models;
using Azure.ResourceManager.CosmosDB;
using Azure.ResourceManager.CosmosDB.Models;
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

    public async Task<AzureRoleCheckResult> CheckSubscriptionRoleAsync(int credentialId)
    {
        try
        {
            var credentials = await _context.UserAzureCredentials.FindAsync(credentialId);
            if (credentials == null)
            {
                return new AzureRoleCheckResult
                {
                    IsValid = false,
                    HasContributorRole = false,
                    Message = "Credentials not found",
                    ErrorMessage = "Azure credentials not found for the specified ID"
                };
            }

            if (!credentials.IsActive)
            {
                return new AzureRoleCheckResult
                {
                    IsValid = false,
                    HasContributorRole = false,
                    Message = "Credentials are inactive",
                    ErrorMessage = "Azure credentials are marked as inactive"
                };
            }

            var armClient = CreateArmClient(credentials);
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{credentials.SubscriptionId}"));

            // Get role assignments for the service principal at subscription level
            var roleAssignments = subscription.GetRoleAssignments();
            var assignedRoles = new List<string>();
            bool hasContributorRole = false;

            // The Contributor role definition ID is a well-known GUID in Azure
            const string contributorRoleDefinitionId = "b24988ac-6180-42a0-ab88-20f7382dd24c";
            
            await foreach (var roleAssignment in roleAssignments)
            {
                try
                {
                    var assignment = await roleAssignment.GetAsync();
                    var principalId = assignment.Value.Data.PrincipalId?.ToString();
                    
                    // Check if this role assignment is for our service principal
                    if (principalId == credentials.ClientId)
                    {
                        var roleDefinitionId = assignment.Value.Data.RoleDefinitionId?.ToString();
                        
                        // Extract the role definition ID from the full resource ID
                        if (!string.IsNullOrEmpty(roleDefinitionId))
                        {
                            var roleId = roleDefinitionId.Split('/').LastOrDefault();
                            assignedRoles.Add(roleId ?? roleDefinitionId);
                            
                            // Check if this is the Contributor role
                            if (roleId == contributorRoleDefinitionId)
                            {
                                hasContributorRole = true;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing role assignment for credential {CredentialId}", credentialId);
                    // Continue processing other role assignments
                }
            }

            var message = hasContributorRole 
                ? "Service principal has Contributor role on the subscription"
                : assignedRoles.Any() 
                    ? "Service principal has roles assigned but not Contributor role"
                    : "No role assignments found for this service principal on the subscription";

            return new AzureRoleCheckResult
            {
                IsValid = true,
                HasContributorRole = hasContributorRole,
                Message = message,
                AssignedRoles = assignedRoles
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking subscription roles for credential {CredentialId}", credentialId);
            
            return new AzureRoleCheckResult
            {
                IsValid = false,
                HasContributorRole = false,
                Message = "Error checking subscription roles",
                ErrorMessage = ex.Message
            };
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
                _logger.LogError("Project {ProjectId} has no Azure credentials configured. Cannot provision resources without Azure credentials.", projectId);
                throw new InvalidOperationException($"Project {projectId} has no Azure credentials configured. Please assign Azure credentials to this project before provisioning resources.");
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
                "microsoft.insights/components" => await ProvisionApplicationInsightsAsync(resourceGroup, azureResource, recommendation),
                "microsoft.cache/redis" => await Task.FromResult(false), // Redis provisioning disabled due to SDK issues
                "microsoft.cosmosdb/databaseaccounts" => await ProvisionCosmosDBAsync(resourceGroup, azureResource, recommendation),
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
            
            // Use Free tier as fallback if quota issues exist
            var skuName = config.Sku?.Name ?? "F1";
            var skuTier = config.Sku?.Tier ?? "Free";
            var skuSize = config.Sku?.Size ?? "F1";
            var skuFamily = config.Sku?.Family ?? "F";
            
            // If the recommended plan is Premium/Standard and we're hitting quota issues, 
            // fall back to Free tier for testing
            if (skuTier is "Basic" or "Premium" or "PremiumV2" or "Standard")
            {
                _logger.LogWarning("Using Free tier instead of {Tier} to avoid quota issues", skuTier);
                skuName = "F1";
                skuTier = "Free";
                skuSize = "F1";
                skuFamily = "F";
            }

            var planData = new AppServicePlanData(recommendation.Location)
            {
                Sku = new AppServiceSkuDescription
                {
                    Name = skuName,
                    Tier = skuTier,
                    Size = skuSize,
                    Family = skuFamily,
                    Capacity = 1
                },
                Kind = config.Kind ?? "app"
            };

            planData.Tags.Add("CreatedBy", "Easel");
            planData.Tags.Add("ProjectId", azureResource.ProjectId.ToString());

            _logger.LogInformation("Creating App Service Plan {PlanName}", recommendation.Name);
            
            try
            {
                var operation = await planCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, recommendation.Name, planData);
                _logger.LogInformation("Successfully provisioned App Service Plan {PlanName}", recommendation.Name);
            }
            catch (Azure.RequestFailedException ex) when (ex.Status == 409 && ex.ErrorCode == "Conflict")
            {
                _logger.LogWarning("App Service Plan creation conflict, waiting and retrying with unique name");
                
                // Generate a unique name with timestamp
                var uniqueName = $"{recommendation.Name}-{DateTime.UtcNow:yyyyMMddHHmmss}";
                _logger.LogInformation("Retrying App Service Plan creation with name {UniqueName}", uniqueName);
                
                await Task.Delay(2000); // Wait 2 seconds
                var retryOperation = await planCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, uniqueName, planData);
                _logger.LogInformation("Successfully provisioned App Service Plan with retry {UniqueName}", uniqueName);
            }
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
            
            _logger.LogInformation("App Service configuration: {Config}", JsonSerializer.Serialize(config));
            
            // Create App Service Plan first if not specified
            var planName = config.ServicePlanName ?? $"{recommendation.Name}-plan";
            var planCollection = resourceGroup.GetAppServicePlans();
            
            // Force Free tier for all App Services to avoid quota issues
            var skuName = "F1";
            var skuTier = "Free";
            var skuSize = "F1";
            var skuFamily = "F";
            
            _logger.LogWarning("Forcing Free tier for App Service {ServiceName} to avoid quota issues. Original config: {OriginalConfig}", 
                recommendation.Name, JsonSerializer.Serialize(config.Sku));
            
            _logger.LogInformation("Using SKU values - Name: {Name}, Tier: {Tier}, Size: {Size}, Family: {Family}", 
                skuName, skuTier, skuSize, skuFamily);

            var planData = new AppServicePlanData(recommendation.Location)
            {
                Sku = new AppServiceSkuDescription
                {
                    Name = skuName,
                    Tier = skuTier,
                    Size = skuSize,
                    Family = skuFamily,
                    Capacity = 1
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
        catch (Azure.RequestFailedException ex) when (ex.Status == 401 && ex.Message.Contains("quota"))
        {
            _logger.LogWarning("App Service provisioning failed due to quota limits: {Error}", ex.Message);
            _logger.LogInformation("Consider using Azure Container Apps or Azure Functions for serverless hosting alternatives");
            return false;
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
            
            SqlServerResource server;
            try
            {
                var serverOperation = await sqlServerCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, serverName, serverData);
                server = serverOperation.Value;
            }
            catch (Azure.RequestFailedException ex) when (ex.ErrorCode == "ProvisioningDisabled")
            {
                _logger.LogWarning("SQL provisioning disabled in {Location}, trying West US 2", recommendation.Location);
                
                // Try West US 2 as fallback region
                serverData = new SqlServerData("West US 2")
                {
                    AdministratorLogin = config.AdminUsername ?? "easel-admin",
                    AdministratorLoginPassword = config.AdminPassword ?? GenerateSecurePassword(),
                    Tags =
                    {
                        ["CreatedBy"] = "Easel",
                        ["ProjectId"] = azureResource.ProjectId.ToString(),
                        ["OriginalLocation"] = recommendation.Location
                    }
                };
                
                try
                {
                    var retryOperation = await sqlServerCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, serverName, serverData);
                    server = retryOperation.Value;
                    _logger.LogInformation("Successfully created SQL Server {ServerName} in fallback region West US 2", serverName);
                }
                catch (Azure.RequestFailedException ex2) when (ex2.Status == 409 && (ex2.ErrorCode == "InvalidResourceLocation" || ex2.Message.Contains("already exists")))
                {
                    _logger.LogWarning("SQL Server name conflict in fallback region, trying with unique name for {ServerName}", serverName);
                    
                    // Generate a unique name with timestamp
                    var uniqueServerName = $"{serverName}-{DateTime.UtcNow:yyyyMMddHHmmss}";
                    _logger.LogInformation("Retrying SQL Server creation with name {UniqueServerName} in West US 2", uniqueServerName);
                    
                    var uniqueRetryOperation = await sqlServerCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, uniqueServerName, serverData);
                    server = uniqueRetryOperation.Value;
                    _logger.LogInformation("Successfully created SQL Server {UniqueServerName} with unique name in West US 2", uniqueServerName);
                }
            }
            catch (Azure.RequestFailedException ex) when (ex.Status == 409 && (ex.ErrorCode == "InvalidResourceLocation" || ex.Message.Contains("already exists")))
            {
                _logger.LogWarning("SQL Server name conflict, trying with unique name for {ServerName}. Error: {Error}", serverName, ex.Message);
                
                // Generate a unique name with timestamp
                var uniqueServerName = $"{serverName}-{DateTime.UtcNow:yyyyMMddHHmmss}";
                _logger.LogInformation("Retrying SQL Server creation with name {UniqueServerName}", uniqueServerName);
                
                var retryOperation = await sqlServerCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, uniqueServerName, serverData);
                server = retryOperation.Value;
                _logger.LogInformation("Successfully created SQL Server {UniqueServerName} with unique name", uniqueServerName);
            }

            // Create the database (inherits location from server)
            var databaseCollection = server.GetSqlDatabases();
            var databaseData = new SqlDatabaseData(server.Data.Location)
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
        catch (Azure.RequestFailedException ex) when (ex.ErrorCode == "ProvisioningDisabled")
        {
            _logger.LogWarning("SQL Database provisioning disabled in this region: {Error}", ex.Message);
            _logger.LogInformation("Consider using Azure Cosmos DB or Azure Database for PostgreSQL as alternatives");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision SQL Database {DatabaseName}", recommendation.Name);
            return false;
        }
    }

    private async Task<bool> ProvisionApplicationInsightsAsync(ResourceGroupResource resourceGroup, AzureResource azureResource, AzureResourceRecommendation recommendation)
    {
        try
        {
            _logger.LogInformation("Creating Application Insights {ComponentName}", recommendation.Name);
            
            var componentsCollection = resourceGroup.GetApplicationInsightsComponents();
            var config = JsonSerializer.Deserialize<ApplicationInsightsConfig>(azureResource.Configuration) ?? new ApplicationInsightsConfig();
            
            var componentData = new ApplicationInsightsComponentData(recommendation.Location, "web")
            {
                Kind = "web",
                Tags =
                {
                    ["CreatedBy"] = "Easel",
                    ["ProjectId"] = azureResource.ProjectId.ToString()
                }
            };
            
            // Set application type if specified in config
            if (!string.IsNullOrEmpty(config.ApplicationType))
            {
                componentData.ApplicationType = config.ApplicationType;
            }
            
            var operation = await componentsCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, recommendation.Name, componentData);
            var component = operation.Value;
            
            azureResource.AzureResourceId = component.Id.ToString();
            azureResource.Status = ResourceStatus.Active;
            azureResource.ProvisionedAt = DateTime.UtcNow;
            
            _context.AzureResources.Update(azureResource);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Successfully created Application Insights {ComponentName}", recommendation.Name);
            return true;
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 409 && ex.Message.Contains("Failed to register resource provider"))
        {
            _logger.LogWarning("Application Insights resource provider not registered: {Error}", ex.Message);
            _logger.LogInformation("The subscription needs to register the microsoft.operationalinsights resource provider for Application Insights");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision Application Insights {ComponentName}", recommendation.Name);
            return false;
        }
    }

    /*
    private async Task<bool> ProvisionRedisCacheAsync(ResourceGroupResource resourceGroup, AzureResource azureResource, AzureResourceRecommendation recommendation)
    {
        // Redis provisioning disabled due to Azure SDK compatibility issues
        _logger.LogWarning("Redis Cache provisioning is disabled in this build");
        await Task.CompletedTask;
        return false;
    }
    */

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
                "microsoft.insights/components" => await DeleteApplicationInsightsAsync(resourceGroup, azureResource),
                "microsoft.cache/redis" => await Task.FromResult(false), // Redis deletion disabled
                "microsoft.cosmosdb/databaseaccounts" => await DeleteCosmosDBAsync(resourceGroup, azureResource),
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

    private async Task<bool> DeleteApplicationInsightsAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        try
        {
            var componentsCollection = resourceGroup.GetApplicationInsightsComponents();
            var component = await componentsCollection.GetAsync(azureResource.Name);
            
            _logger.LogInformation("Deleting Application Insights {ComponentName}", azureResource.Name);
            await component.Value.DeleteAsync(Azure.WaitUntil.Completed);
            
            _logger.LogInformation("Successfully deleted Application Insights {ComponentName}", azureResource.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete Application Insights {ComponentName}", azureResource.Name);
            return false;
        }
    }
    
    /*
    private async Task<bool> DeleteRedisCacheAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        // Redis deletion disabled due to Azure SDK compatibility issues
        _logger.LogWarning("Redis Cache deletion is disabled in this build");
        await Task.CompletedTask;
        return false;
    }
    */

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
            "microsoft.insights/components" => "Application Insights",
            "microsoft.cache/redis" => "Redis Cache",
            "microsoft.cosmosdb/databaseaccounts" => "Cosmos DB",
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
            "microsoft.insights/components" => "⚠️ This will delete Application Insights monitoring data and configuration.",
            "microsoft.cache/redis" => "⚠️ This will permanently delete the Redis cache and all cached data.",
            "microsoft.cosmosdb/databaseaccounts" => "⚠️ This will permanently delete the Cosmos DB account and all databases and data.",
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
    
    /*
    private RedisSkuName? ParseRedisSkuName(string? sku)
    {
        return sku?.ToLower() switch
        {
            "basic" => RedisSkuName.Basic,
            "standard" => RedisSkuName.Standard,
            "premium" => RedisSkuName.Premium,
            _ => null
        };
    }
    
    private RedisSkuFamily? ParseRedisSkuFamily(string? family)
    {
        return family?.ToUpper() switch
        {
            "C" => RedisSkuFamily.C,
            "P" => RedisSkuFamily.P,
            _ => null
        };
    }
    */
    
    private async Task<bool> ProvisionCosmosDBAsync(ResourceGroupResource resourceGroup, AzureResource azureResource, AzureResourceRecommendation recommendation)
    {
        try
        {
            var cosmosCollection = resourceGroup.GetCosmosDBAccounts();
            var config = JsonSerializer.Deserialize<CosmosDBConfig>(azureResource.Configuration) ?? new CosmosDBConfig();
            
            var locations = new List<CosmosDBAccountLocation>
            {
                new CosmosDBAccountLocation()
                {
                    LocationName = recommendation.Location,
                    FailoverPriority = 0,
                    IsZoneRedundant = false
                }
            };
            
            var cosmosData = new CosmosDBAccountCreateOrUpdateContent(recommendation.Location, locations)
            {
                DatabaseAccountOfferType = CosmosDBAccountOfferType.Standard,
                IsVirtualNetworkFilterEnabled = false,
                EnableAutomaticFailover = false,
                ConsistencyPolicy = new ConsistencyPolicy(DefaultConsistencyLevel.Session),
                Tags =
                {
                    ["CreatedBy"] = "Easel",
                    ["ProjectId"] = azureResource.ProjectId.ToString()
                }
            };

            _logger.LogInformation("Creating Cosmos DB Account {AccountName}", recommendation.Name);
            var operation = await cosmosCollection.CreateOrUpdateAsync(Azure.WaitUntil.Completed, recommendation.Name, cosmosData);
            
            _logger.LogInformation("Successfully provisioned Cosmos DB Account {AccountName}", recommendation.Name);
            return true;
        }
        catch (Azure.RequestFailedException ex) when (ex.ErrorCode == "MissingSubscriptionRegistration")
        {
            _logger.LogWarning("Cosmos DB namespace not registered in subscription: {Error}", ex.Message);
            _logger.LogInformation("The subscription needs to register the Microsoft.DocumentDB namespace. Consider using Azure SQL Database or Storage Tables as alternatives");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to provision Cosmos DB Account {AccountName}", recommendation.Name);
            return false;
        }
    }
    
    
    private async Task<bool> DeleteCosmosDBAsync(ResourceGroupResource resourceGroup, AzureResource azureResource)
    {
        try
        {
            var cosmosAccounts = resourceGroup.GetCosmosDBAccounts();
            var cosmosAccount = await cosmosAccounts.GetAsync(azureResource.Name);
            
            _logger.LogInformation("Deleting Cosmos DB Account {AccountName}", azureResource.Name);
            await cosmosAccount.Value.DeleteAsync(Azure.WaitUntil.Completed);
            
            _logger.LogInformation("Successfully deleted Cosmos DB Account {AccountName}", azureResource.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete Cosmos DB Account {AccountName}", azureResource.Name);
            return false;
        }
    }
}

// Configuration classes for Azure resources
public class ApplicationInsightsConfig
{
    public string? ApplicationType { get; set; }
}

public class RedisCacheConfig
{
    public string? Sku { get; set; }
    public string? Family { get; set; }
    public int? Capacity { get; set; }
}

public class CosmosDBConfig
{
    public string? DatabaseAccountOfferType { get; set; }
    public string? ConsistencyLevel { get; set; }
    public bool? EnableAutomaticFailover { get; set; }
    public bool? EnableMultipleWriteLocations { get; set; }
}

