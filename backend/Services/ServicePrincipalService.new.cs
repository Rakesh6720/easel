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

    public async Task<bool> ValidateUserAzureAccessAsync(string accessToken)
    {
        try
        {
            // Create a Graph client using the user's access token
            var authProvider = new BaseBearerTokenAuthenticationProvider(
                new BearerTokenProvider(accessToken));
            var graphClient = new GraphServiceClient(authProvider);

            // Try to get user info to validate the token
            var user = await graphClient.Me.GetAsync();
            return user != null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to validate user Azure access token");
            return false;
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

            // Step 5: Assign Contributor role if requested
            if (request.AutoAssignContributorRole)
            {
                try
                {
                    var roleAssigned = await AssignContributorRoleAsync(
                        request.SubscriptionId, 
                        createdSp.Id, 
                        request.AccessToken,
                        tenantId);
                    
                    result.ContributorRoleAssigned = roleAssigned;
                    
                    if (!roleAssigned)
                    {
                        result.Warnings.Add("Service principal created successfully but Contributor role assignment failed. You may need to assign the role manually.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to assign Contributor role to service principal");
                    result.Warnings.Add($"Role assignment failed: {ex.Message}");
                }
            }

            // Step 6: Automatically save credentials to user's account if role assignment succeeded
            if (result.ContributorRoleAssigned || !request.AutoAssignContributorRole)
            {
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign Contributor role");
            return false;
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
}

// Helper class for token-based authentication
public class BearerTokenProvider
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
