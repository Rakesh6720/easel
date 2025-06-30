using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Graph.Applications.Item.AddPassword;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Authorization;
using Azure.ResourceManager.Authorization.Models;
using backend.Models;
using backend.Data;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Kiota.Abstractions.Authentication;

namespace backend.Services;

public class ServicePrincipalService : IServicePrincipalService
{
    private readonly EaselDbContext _context;
    private readonly ILogger<ServicePrincipalService> _logger;
    private readonly IConfiguration _configuration;

    public ServicePrincipalService(
        EaselDbContext context, 
        ILogger<ServicePrincipalService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }

    public Task<bool> ValidateUserAzureAccessAsync(string accessToken)
    {
        try
        {
            // First, do basic token validation
            if (string.IsNullOrWhiteSpace(accessToken))
            {
                _logger.LogWarning("Access token is null or empty");
                return Task.FromResult(false);
            }

            // Try to decode and validate the JWT token structure
            var tokenParts = accessToken.Split('.');
            if (tokenParts.Length != 3)
            {
                _logger.LogWarning("Access token is not a valid JWT token (wrong number of parts)");
                return Task.FromResult(false);
            }

            // Decode the payload to check basic token properties
            try
            {
                var payload = tokenParts[1];
                // Add padding if needed
                switch (payload.Length % 4)
                {
                    case 2: payload += "=="; break;
                    case 3: payload += "="; break;
                }

                var jsonBytes = Convert.FromBase64String(payload);
                var json = System.Text.Encoding.UTF8.GetString(jsonBytes);
                var tokenData = JsonSerializer.Deserialize<Dictionary<string, object>>(json);

                if (tokenData == null)
                {
                    _logger.LogWarning("Failed to parse token payload as JSON");
                    return Task.FromResult(false);
                }

                // Check if token has expired
                if (tokenData.TryGetValue("exp", out var expObj))
                {
                    if (long.TryParse(expObj.ToString(), out var exp))
                    {
                        var expirationTime = DateTimeOffset.FromUnixTimeSeconds(exp);
                        if (expirationTime <= DateTimeOffset.UtcNow)
                        {
                            _logger.LogWarning("Access token has expired");
                            return Task.FromResult(false);
                        }
                    }
                }

                // Check if token has required claims
                if (!tokenData.ContainsKey("tid") || !tokenData.ContainsKey("oid"))
                {
                    _logger.LogWarning("Access token missing required claims (tid or oid)");
                    return Task.FromResult(false);
                }

                _logger.LogInformation("Token validation successful - basic checks passed");
                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to decode or validate token payload");
                return Task.FromResult(false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to validate user Azure access token");
            return Task.FromResult(false);
        }
    }

    public async Task<ServicePrincipalCreationResult> CreateServicePrincipalAsync(
        CreateServicePrincipalRequest request, int userId)
    {
        try
        {
            _logger.LogInformation("Starting service principal creation for user {UserId}", userId);

            // Validate user's access token
            if (!await ValidateUserAzureAccessAsync(request.AccessToken))
            {
                return new ServicePrincipalCreationResult
                {
                    Success = false,
                    ErrorMessage = "Invalid Azure access token. Please sign in to Azure again."
                };
            }

            // Create Graph client with user's token
            var authProvider = new BaseBearerTokenAuthenticationProvider(
                new BearerTokenProvider(request.AccessToken));
            var graphClient = new GraphServiceClient(authProvider);

            // Step 1: Create the application registration
            var application = new Application
            {
                DisplayName = request.DisplayName,
                Description = $"Service principal created by Easel for subscription {request.SubscriptionId}",
                SignInAudience = "AzureADMyOrg"
            };

            var createdApp = await graphClient.Applications.PostAsync(application);
            _logger.LogInformation("Created application registration with ID: {AppId}", createdApp?.Id);

            if (createdApp?.AppId == null)
            {
                throw new InvalidOperationException("Failed to create application - no AppId returned");
            }

            // Step 2: Create service principal from the application
            var servicePrincipal = new ServicePrincipal
            {
                AppId = createdApp.AppId,
                DisplayName = request.DisplayName
            };

            var createdSp = await graphClient.ServicePrincipals.PostAsync(servicePrincipal);
            _logger.LogInformation("Created service principal with ID: {SpId}", createdSp?.Id);

            if (createdSp?.Id == null)
            {
                throw new InvalidOperationException("Failed to create service principal - no ID returned");
            }

            // Step 3: Create client secret
            var passwordCredential = new AddPasswordPostRequestBody
            {
                PasswordCredential = new PasswordCredential
                {
                    DisplayName = "Easel-generated secret",
                    EndDateTime = DateTimeOffset.UtcNow.AddYears(2) // 2-year expiration
                }
            };

            var secretResult = await graphClient.Applications[createdApp.Id]
                .AddPassword.PostAsync(passwordCredential);

            var clientSecret = secretResult?.SecretText;
            _logger.LogInformation("Generated client secret for application");

            if (string.IsNullOrEmpty(clientSecret))
            {
                throw new InvalidOperationException("Failed to generate client secret");
            }

            // Step 4: Get tenant ID from the user's token
            var userInfo = await graphClient.Me.GetAsync();
            var tenantId = GetTenantIdFromToken(request.AccessToken);

            var result = new ServicePrincipalCreationResult
            {
                Success = true,
                ServicePrincipalId = createdSp.Id,
                ClientId = createdApp.AppId,
                ClientSecret = clientSecret,
                TenantId = tenantId,
                SubscriptionId = request.SubscriptionId,
                DisplayName = request.DisplayName,
                ContributorRoleAssigned = false
            };

            // Step 5: Assign roles if requested
            if (request.AutoAssignContributorRole)
            {
                try
                {
                    // First, try to assign User Access Administrator role to enable role assignment capabilities
                    var userAccessAdminAssigned = await AssignUserAccessAdministratorRoleAsync(
                        request.SubscriptionId, createdSp.Id, request.AccessToken, tenantId);
                    
                    if (userAccessAdminAssigned)
                    {
                        result.Warnings.Add("User Access Administrator role assigned - this enables the service principal to assign other roles.");
                        
                        // Wait a moment for the role assignment to propagate
                        await Task.Delay(2000);
                        
                        // Now try to assign Contributor role using the service principal's own credentials
                        var contributorAssigned = await AssignContributorRoleUsingServicePrincipalAsync(
                            request.SubscriptionId, createdApp.AppId, clientSecret, tenantId);
                        
                        if (contributorAssigned)
                        {
                            result.ContributorRoleAssigned = true;
                            result.Warnings.Add("Contributor role successfully assigned!");
                        }
                        else
                        {
                            result.Warnings.Add("User Access Administrator role assigned, but Contributor role assignment failed. You can retry the role assignment from the settings page.");
                        }
                    }
                    else
                    {
                        result.Warnings.Add("Could not assign User Access Administrator role. You may need to manually assign roles in the Azure portal, or have an administrator do it.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to assign roles during service principal creation");
                    result.Warnings.Add($"Role assignment failed: {ex.Message}. You can assign roles manually after creation.");
                }
            }

            // Step 6: Always save credentials to user's account since we're not doing role assignment during creation
            try
            {
                await SaveCredentialsToUserAccount(result, userId);
                _logger.LogInformation("Saved service principal credentials to user account");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save credentials to user account");
                result.Warnings.Add("Credentials created but failed to save to your account. Please add them manually.");
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create service principal for user {UserId}", userId);
            return new ServicePrincipalCreationResult
            {
                Success = false,
                ErrorMessage = $"Failed to create service principal: {ex.Message}"
            };
        }
    }

    private async Task<bool> AssignContributorRoleAsync(
        string subscriptionId, 
        string servicePrincipalId, 
        string accessToken,
        string tenantId)
    {
        try
        {
            // Create ARM client with user's token
            var tokenCredential = new AccessTokenCredential(accessToken);
            var armClient = new ArmClient(tokenCredential);
            
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}"));

            // The Contributor role definition ID
            const string contributorRoleDefinitionId = "b24988ac-6180-42a0-ab88-20f7382dd24c";
            
            var roleAssignmentName = Guid.NewGuid().ToString();
            var roleAssignmentData = new RoleAssignmentCreateOrUpdateContent(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/{contributorRoleDefinitionId}"),
                Guid.Parse(servicePrincipalId))
            {
                PrincipalType = RoleManagementPrincipalType.ServicePrincipal
            };

            var roleAssignment = await subscription.GetRoleAssignments()
                .CreateOrUpdateAsync(Azure.WaitUntil.Completed, roleAssignmentName, roleAssignmentData);

            return roleAssignment.HasCompleted;
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 409 && ex.ErrorCode == "RoleAssignmentExists")
        {
            _logger.LogInformation("Contributor role already exists for service principal - treating as success");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign Contributor role");
            return false;
        }
    }

    private async Task<bool> AssignContributorRoleUsingServicePrincipalAsync(
        string subscriptionId, 
        string clientId,
        string clientSecret,
        string tenantId)
    {
        try
        {
            _logger.LogInformation("Attempting to assign Contributor role using service principal credentials");
            
            // Create ARM client using the service principal credentials
            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            var armClient = new ArmClient(credential);
            
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}"));

            // Get the service principal object ID
            var servicePrincipalObjectId = await GetServicePrincipalObjectIdUsingCredentialsAsync(clientId, clientSecret, tenantId);
            
            if (string.IsNullOrEmpty(servicePrincipalObjectId))
            {
                _logger.LogWarning("Could not retrieve service principal object ID");
                return false;
            }

            // The Contributor role definition ID
            const string contributorRoleDefinitionId = "b24988ac-6180-42a0-ab88-20f7382dd24c";
            
            var roleAssignmentName = Guid.NewGuid().ToString();
            var roleAssignmentData = new RoleAssignmentCreateOrUpdateContent(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/{contributorRoleDefinitionId}"),
                Guid.Parse(servicePrincipalObjectId))
            {
                PrincipalType = RoleManagementPrincipalType.ServicePrincipal
            };

            var roleAssignment = await subscription.GetRoleAssignments()
                .CreateOrUpdateAsync(Azure.WaitUntil.Completed, roleAssignmentName, roleAssignmentData);

            return roleAssignment.HasCompleted;
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 409 && ex.ErrorCode == "RoleAssignmentExists")
        {
            _logger.LogInformation("Contributor role already exists for service principal - treating as success");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign Contributor role using service principal");
            return false;
        }
    }

    private async Task<string?> GetServicePrincipalObjectIdUsingCredentialsAsync(string clientId, string clientSecret, string tenantId)
    {
        try
        {
            // Use service principal credentials to get its own object ID from Graph API
            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            var graphClient = new GraphServiceClient(credential);

            // Query for the service principal by appId (clientId)
            var servicePrincipals = await graphClient.ServicePrincipals
                .GetAsync(requestConfiguration => {
                    requestConfiguration.QueryParameters.Filter = $"appId eq '{clientId}'";
                });

            var servicePrincipal = servicePrincipals?.Value?.FirstOrDefault();
            return servicePrincipal?.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get service principal object ID using credentials");
            return null;
        }
    }

    private async Task SaveCredentialsToUserAccount(ServicePrincipalCreationResult result, int userId)
    {
        var credentials = new UserAzureCredential
        {
            UserId = userId,
            SubscriptionId = result.SubscriptionId!,
            TenantId = result.TenantId!,
            ClientId = result.ClientId!,
            ClientSecret = result.ClientSecret!, // TODO: Encrypt in production
            DisplayName = result.DisplayName!,
            IsDefault = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            LastValidated = DateTime.UtcNow
        };

        // Set as default if this is the user's first credential
        var existingCredentials = await _context.UserAzureCredentials
            .Where(c => c.UserId == userId && c.IsActive)
            .CountAsync();
        
        if (existingCredentials == 0)
        {
            credentials.IsDefault = true;
        }

        _context.UserAzureCredentials.Add(credentials);
        await _context.SaveChangesAsync();
    }

    private string GetTenantIdFromToken(string accessToken)
    {
        try
        {
            // Decode JWT token to extract tenant ID
            var tokenParts = accessToken.Split('.');
            if (tokenParts.Length != 3) return string.Empty;

            var payload = tokenParts[1];
            
            // Add padding if needed
            switch (payload.Length % 4)
            {
                case 2: payload += "=="; break;
                case 3: payload += "="; break;
            }

            var jsonBytes = Convert.FromBase64String(payload);
            var json = System.Text.Encoding.UTF8.GetString(jsonBytes);
            var tokenData = JsonSerializer.Deserialize<Dictionary<string, object>>(json);

            if (tokenData?.TryGetValue("tid", out var tenantId) == true)
            {
                return tenantId.ToString() ?? string.Empty;
            }

            return string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract tenant ID from token");
            return string.Empty;
        }
    }

    public async Task<RoleAssignmentResult> AssignContributorRoleToExistingCredentialAsync(int credentialId, string accessToken, int userId)
    {
        try
        {
            _logger.LogInformation("Assigning Contributor role to credential {CredentialId} for user {UserId}", credentialId, userId);

            // Validate user's access token (this validates the Graph token for AD operations)
            if (!await ValidateUserAzureAccessAsync(accessToken))
            {
                return new RoleAssignmentResult
                {
                    Success = false,
                    ErrorMessage = "Invalid Azure access token. Please get a fresh token from Azure CLI using: az account get-access-token --resource https://graph.microsoft.com/ --query accessToken --output tsv"
                };
            }

            // Get the credential from database
            var credential = await _context.UserAzureCredentials
                .FirstOrDefaultAsync(c => c.Id == credentialId && c.UserId == userId && c.IsActive);

            if (credential == null)
            {
                return new RoleAssignmentResult
                {
                    Success = false,
                    ErrorMessage = "Credential not found or you don't have permission to access it."
                };
            }

            // For role assignment, we'll try multiple approaches:
            // 1. First try using the user's token to assign User Access Administrator role
            // 2. Then use service principal credentials to assign Contributor role
            try
            {
                // Get the service principal object ID first
                var servicePrincipalObjectId = await GetServicePrincipalObjectIdUsingCredentialsAsync(
                    credential.ClientId, credential.ClientSecret, credential.TenantId);
                
                if (string.IsNullOrEmpty(servicePrincipalObjectId))
                {
                    return new RoleAssignmentResult
                    {
                        Success = false,
                        ErrorMessage = "Could not retrieve service principal object ID"
                    };
                }

                // Try to assign User Access Administrator role first (using user's token)
                var userAccessAdminAssigned = await AssignUserAccessAdministratorRoleAsync(
                    credential.SubscriptionId, servicePrincipalObjectId, accessToken, credential.TenantId);
                
                if (userAccessAdminAssigned)
                {
                    _logger.LogInformation("User Access Administrator role assigned, now attempting Contributor role assignment");
                    
                    // Wait for role propagation
                    await Task.Delay(2000);
                    
                    // Now try to assign Contributor role using service principal credentials
                    var contributorAssigned = await AssignContributorRoleUsingServicePrincipalAsync(
                        credential.SubscriptionId, credential.ClientId, credential.ClientSecret, credential.TenantId);

                    if (contributorAssigned)
                    {
                        return new RoleAssignmentResult
                        {
                            Success = true,
                            Message = "Both User Access Administrator and Contributor roles have been successfully assigned to the service principal."
                        };
                    }
                    else
                    {
                        return new RoleAssignmentResult
                        {
                            Success = false,
                            ErrorMessage = "User Access Administrator role assigned, but Contributor role assignment failed. The service principal now has permission to assign roles - you can try again or assign manually in the Azure portal."
                        };
                    }
                }
                else
                {
                    // Fallback: try direct assignment using service principal credentials
                    var roleAssigned = await AssignContributorRoleUsingServicePrincipalAsync(
                        credential.SubscriptionId, credential.ClientId, credential.ClientSecret, credential.TenantId);

                    if (roleAssigned)
                    {
                        _logger.LogInformation("Successfully assigned Contributor role to credential {CredentialId}", credentialId);
                        return new RoleAssignmentResult
                        {
                            Success = true,
                            Message = "Contributor role has been successfully assigned to the service principal."
                        };
                    }
                    else
                    {
                        return new RoleAssignmentResult
                        {
                            Success = false,
                            ErrorMessage = "Failed to assign Contributor role. This typically means the service principal doesn't have sufficient permissions to assign roles to itself. You may need to manually assign the role in the Azure portal, or have an administrator do it."
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to assign role using service principal credentials");
                return new RoleAssignmentResult
                {
                    Success = false,
                    ErrorMessage = $"Failed to assign role: {ex.Message}. Note: Service principals cannot assign roles to themselves unless they already have elevated permissions."
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign Contributor role to credential {CredentialId}", credentialId);
            return new RoleAssignmentResult
            {
                Success = false,
                ErrorMessage = $"Failed to assign contributor role: {ex.Message}"
            };
        }
    }

    public async Task<RoleAssignmentResult> ElevateServicePrincipalPermissionsAsync(int credentialId, string accessToken, int userId)
    {
        try
        {
            _logger.LogInformation("Elevating permissions for credential {CredentialId} for user {UserId}", credentialId, userId);

            // Validate user's access token
            if (!await ValidateUserAzureAccessAsync(accessToken))
            {
                return new RoleAssignmentResult
                {
                    Success = false,
                    ErrorMessage = "Invalid Azure access token. Please get a fresh token from Azure CLI using: az account get-access-token --resource https://management.azure.com/ --query accessToken --output tsv"
                };
            }

            // Get the credential from database
            var credential = await _context.UserAzureCredentials
                .FirstOrDefaultAsync(c => c.Id == credentialId && c.UserId == userId && c.IsActive);

            if (credential == null)
            {
                return new RoleAssignmentResult
                {
                    Success = false,
                    ErrorMessage = "Credential not found or you don't have permission to access it."
                };
            }

            // Get the service principal object ID
            var servicePrincipalObjectId = await GetServicePrincipalObjectIdUsingCredentialsAsync(
                credential.ClientId, credential.ClientSecret, credential.TenantId);
            
            if (string.IsNullOrEmpty(servicePrincipalObjectId))
            {
                return new RoleAssignmentResult
                {
                    Success = false,
                    ErrorMessage = "Could not retrieve service principal object ID"
                };
            }

            // Assign User Access Administrator role using user's token
            var userAccessAdminAssigned = await AssignUserAccessAdministratorRoleAsync(
                credential.SubscriptionId, servicePrincipalObjectId, accessToken, credential.TenantId);
            
            if (userAccessAdminAssigned)
            {
                return new RoleAssignmentResult
                {
                    Success = true,
                    Message = "User Access Administrator role successfully assigned! The service principal can now assign other roles including Contributor. You can now use the 'Assign Contributor Role' feature."
                };
            }
            else
            {
                return new RoleAssignmentResult
                {
                    Success = false,
                    ErrorMessage = "Failed to assign User Access Administrator role. You may need to have Owner or User Access Administrator permissions on the subscription, or contact an administrator."
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to elevate permissions for credential {CredentialId}", credentialId);
            return new RoleAssignmentResult
            {
                Success = false,
                ErrorMessage = $"Failed to elevate permissions: {ex.Message}"
            };
        }
    }

    public async Task<ContributorRoleCheckResult> CheckContributorRoleAsync(int credentialId, int userId)
    {
        try
        {
            _logger.LogInformation("Checking Contributor role for credential {CredentialId} and user {UserId}", credentialId, userId);

            // Get the credential from database
            var credential = await _context.UserAzureCredentials
                .FirstOrDefaultAsync(c => c.Id == credentialId && c.UserId == userId);

            if (credential == null)
            {
                return new ContributorRoleCheckResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Credential not found or access denied"
                };
            }

            // Create ARM client using the service principal credentials
            var credential_arm = new ClientSecretCredential(
                credential.TenantId,
                credential.ClientId,
                credential.ClientSecret);

            var armClient = new ArmClient(credential_arm);
            var subscription = armClient.GetDefaultSubscription();

            // Check if the service principal has Contributor role at subscription level
            var contributorRoleDefinitionId = "b24988ac-6180-42a0-ab88-20f7382dd24c"; // Contributor role GUID
            var servicePrincipalObjectId = await GetServicePrincipalObjectIdAsync(credential.ClientId);

            if (string.IsNullOrEmpty(servicePrincipalObjectId))
            {
                return new ContributorRoleCheckResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Could not find service principal object ID"
                };
            }

            // Check role assignments
            var roleAssignments = subscription.GetRoleAssignments();
            await foreach (var assignment in roleAssignments.GetAllAsync())
            {
                var assignmentData = assignment.Data;
                if (assignmentData.PrincipalId.ToString() == servicePrincipalObjectId &&
                    assignmentData.RoleDefinitionId.ToString().Contains(contributorRoleDefinitionId))
                {
                    return new ContributorRoleCheckResult
                    {
                        IsSuccess = true,
                        HasContributorRole = true,
                        Message = "Service principal has Contributor role"
                    };
                }
            }

            return new ContributorRoleCheckResult
            {
                IsSuccess = true,
                HasContributorRole = false,
                Message = "Service principal does not have Contributor role"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Contributor role for credential {CredentialId}", credentialId);
            return new ContributorRoleCheckResult
            {
                IsSuccess = false,
                ErrorMessage = $"Failed to check role: {ex.Message}"
            };
        }
    }

    private async Task<(bool HasContributorRole, string Message)> CheckExistingRoleAssignment(string subscriptionId, string servicePrincipalId, string accessToken)
    {
        try
        {
            var tokenCredential = new AccessTokenCredential(accessToken);
            var armClient = new ArmClient(tokenCredential);
            
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}"));

            const string contributorRoleDefinitionId = "b24988ac-6180-42a0-ab88-20f7382dd24c";

            await foreach (var roleAssignment in subscription.GetRoleAssignments().GetAllAsync())
            {
                if (roleAssignment.Data.PrincipalId.ToString() == servicePrincipalId &&
                    roleAssignment.Data.RoleDefinitionId.ToString().Contains(contributorRoleDefinitionId))
                {
                    return (true, "Service principal already has Contributor role");
                }
            }

            return (false, "Service principal does not have Contributor role");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check existing role assignments");
            return (false, "Unable to verify existing role assignments");
        }
    }

    private Task<string?> GetServicePrincipalObjectIdAsync(string clientId)
    {
        try
        {
            // We would need an access token to query Graph API
            // For now, return the clientId as object ID (this would need proper implementation)
            // In production, this should use Microsoft Graph to get the actual object ID
            return Task.FromResult<string?>(clientId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting service principal object ID for client {ClientId}", clientId);
            return Task.FromResult<string?>(null);
        }
    }

    private async Task<bool> AssignUserAccessAdministratorRoleAsync(
        string subscriptionId, 
        string servicePrincipalObjectId, 
        string accessToken,
        string tenantId)
    {
        try
        {
            _logger.LogInformation("Attempting to assign User Access Administrator role to enable role assignment capabilities");
            
            // Create ARM client with user's token (they need permission to assign this role)
            var tokenCredential = new AccessTokenCredential(accessToken);
            var armClient = new ArmClient(tokenCredential);
            
            var subscription = armClient.GetSubscriptionResource(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}"));

            // The User Access Administrator role definition ID
            const string userAccessAdminRoleDefinitionId = "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9";
            
            var roleAssignmentName = Guid.NewGuid().ToString();
            var roleAssignmentData = new RoleAssignmentCreateOrUpdateContent(
                new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/{userAccessAdminRoleDefinitionId}"),
                Guid.Parse(servicePrincipalObjectId))
            {
                PrincipalType = RoleManagementPrincipalType.ServicePrincipal
            };

            var roleAssignment = await subscription.GetRoleAssignments()
                .CreateOrUpdateAsync(Azure.WaitUntil.Completed, roleAssignmentName, roleAssignmentData);

            return roleAssignment.HasCompleted;
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 409 && ex.ErrorCode == "RoleAssignmentExists")
        {
            _logger.LogInformation("User Access Administrator role already exists for service principal - treating as success");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign User Access Administrator role: {Error}", ex.Message);
            return false;
        }
    }
}

// Helper class for token-based authentication
public class BearerTokenProvider : Microsoft.Kiota.Abstractions.Authentication.IAccessTokenProvider
{
    private readonly string _accessToken;

    public BearerTokenProvider(string accessToken)
    {
        _accessToken = accessToken;
    }

    public Task<string> GetAuthorizationTokenAsync(Uri uri, Dictionary<string, object>? additionalAuthenticationContext = null, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_accessToken);
    }

    public AllowedHostsValidator AllowedHostsValidator { get; } = new AllowedHostsValidator();
}

// Helper class for token-based authentication with ARM
public class AccessTokenCredential : Azure.Core.TokenCredential
{
    private readonly string _accessToken;

    public AccessTokenCredential(string accessToken)
    {
        _accessToken = accessToken;
    }

    public override Azure.Core.AccessToken GetToken(Azure.Core.TokenRequestContext requestContext, CancellationToken cancellationToken)
    {
        return new Azure.Core.AccessToken(_accessToken, DateTimeOffset.UtcNow.AddHours(1));
    }

    public override ValueTask<Azure.Core.AccessToken> GetTokenAsync(Azure.Core.TokenRequestContext requestContext, CancellationToken cancellationToken)
    {
        return new ValueTask<Azure.Core.AccessToken>(new Azure.Core.AccessToken(_accessToken, DateTimeOffset.UtcNow.AddHours(1)));
    }
}
