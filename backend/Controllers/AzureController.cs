using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Models;
using backend.Services;
using backend.Repositories;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AzureController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAzureResourceService _azureResourceService;
    private readonly IAzureMonitoringService _azureMonitoringService;
    private readonly IServicePrincipalService _servicePrincipalService;
    private readonly ILogger<AzureController> _logger;

    public AzureController(
        IUnitOfWork unitOfWork,
        IAzureResourceService azureResourceService,
        IAzureMonitoringService azureMonitoringService,
        IServicePrincipalService servicePrincipalService,
        ILogger<AzureController> logger)
    {
        _unitOfWork = unitOfWork;
        _azureResourceService = azureResourceService;
        _azureMonitoringService = azureMonitoringService;
        _servicePrincipalService = servicePrincipalService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }

    [HttpPost("credentials")]
    public async Task<ActionResult<UserAzureCredential>> AddAzureCredentials(Models.AddAzureCredentialsRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Validate the request
            var validation = InputValidator.ValidateAzureCredentials(request);
            if (!validation.IsValid)
            {
                return BadRequest(new { message = "Validation failed", errors = validation.Errors });
            }

            // Check if user already has credentials with same subscription ID
            var existingCredential = await _unitOfWork.UserAzureCredentials
                .FindAsync(c => c.UserId == userId && c.SubscriptionId == request.SubscriptionId);
            var existingCredentialItem = existingCredential.FirstOrDefault();
            
            if (existingCredentialItem != null)
            {
                return BadRequest(new { message = "Credentials for this subscription already exist" });
            }

            var credentials = new UserAzureCredential
            {
                UserId = userId,
                SubscriptionId = request.SubscriptionId,
                TenantId = request.TenantId,
                ClientId = request.ClientId,
                ClientSecret = request.ClientSecret, // TODO: Encrypt this in production
                DisplayName = request.DisplayName,
                IsDefault = false // Will be set to true if this is the user's first credential
            };

            // Validate credentials with Azure
            var isValid = await _azureResourceService.ValidateAzureCredentialsAsync(credentials);
            
            if (!isValid)
            {
                return BadRequest(new { message = "Invalid Azure credentials. Please check your service principal details." });
            }

            // Set as default if this is the user's first credential
            var userCredentials = await _unitOfWork.UserAzureCredentials
                .FindAsync(c => c.UserId == userId && c.IsActive);
            var userCredentialCount = userCredentials.Count();
            
            if (userCredentialCount == 0)
            {
                credentials.IsDefault = true;
            }

            await _unitOfWork.UserAzureCredentials.AddAsync(credentials);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Azure credentials added successfully for user {UserId}, subscription {SubscriptionId}", 
                userId, request.SubscriptionId);

            // Return response without client secret
            var response = new
            {
                id = credentials.Id,
                subscriptionId = credentials.SubscriptionId,
                subscriptionName = credentials.SubscriptionName,
                displayName = credentials.DisplayName,
                isDefault = credentials.IsDefault,
                isActive = credentials.IsActive,
                lastValidated = credentials.LastValidated,
                createdAt = credentials.CreatedAt
            };
            
            return CreatedAtAction(nameof(GetAzureCredentials), new { id = credentials.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding Azure credentials for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new { message = "Failed to add Azure credentials" });
        }
    }

    [HttpGet("credentials/{id}")]
    public async Task<ActionResult<UserAzureCredential>> GetAzureCredentials(int id)
    {
        try
        {
            var credentials = await _unitOfWork.UserAzureCredentials.GetByIdAsync(id);
            
            if (credentials == null)
                return NotFound();

            // Don't return the client secret
            credentials.ClientSecret = "***";
            
            return Ok(credentials);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Azure credentials {CredentialId}", id);
            return StatusCode(500, new { message = "Failed to get Azure credentials" });
        }
    }

    [HttpGet("credentials")]
    public async Task<ActionResult<List<object>>> GetAllAzureCredentials()
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var userCredentials = await _unitOfWork.UserAzureCredentials
                .FindAsync(c => c.UserId == userId && c.IsActive);
            
            var credentials = userCredentials
                .OrderByDescending(c => c.IsDefault)
                .ThenByDescending(c => c.LastValidated)
                .Select(c => new
                {
                    id = c.Id,
                    subscriptionId = c.SubscriptionId,
                    subscriptionName = c.SubscriptionName,
                    displayName = c.DisplayName,
                    isDefault = c.IsDefault,
                    isActive = c.IsActive,
                    lastValidated = c.LastValidated,
                    createdAt = c.CreatedAt
                })
                .ToList();
            
            return Ok(credentials);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Azure credentials for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new { message = "Failed to get Azure credentials" });
        }
    }

    [HttpPost("credentials/{id}/validate")]
    public async Task<ActionResult> ValidateAzureCredentials(int id)
    {
        try
        {
            var credentials = await _unitOfWork.UserAzureCredentials.GetByIdAsync(id);
            
            if (credentials == null)
                return NotFound();

            var isValid = await _azureResourceService.ValidateAzureCredentialsAsync(credentials);
            await _unitOfWork.SaveChangesAsync();
            
            return Ok(new { isValid, lastValidated = credentials.LastValidated });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Azure credentials {CredentialId}", id);
            return BadRequest("Failed to validate credentials");
        }
    }

    [HttpGet("credentials/{id}/locations")]
    public async Task<ActionResult<List<string>>> GetAvailableLocations(int id)
    {
        try
        {
            var locations = await _azureResourceService.GetAvailableLocationsAsync(id);
            return Ok(locations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available locations for credential {CredentialId}", id);
            return BadRequest("Failed to get available locations");
        }
    }

    [HttpGet("resources/{id}/metrics")]
    public async Task<ActionResult<List<ResourceMetric>>> GetResourceMetrics(
        int id, 
        [FromQuery] DateTime? startTime = null, 
        [FromQuery] DateTime? endTime = null)
    {
        try
        {
            var metrics = await _azureMonitoringService.GetResourceMetricsAsync(id);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting metrics for resource {ResourceId}", id);
            return BadRequest("Failed to get resource metrics");
        }
    }

    [HttpGet("resources/{id}/usage")]
    public async Task<ActionResult<Dictionary<string, object>>> GetResourceUsage(int id)
    {
        try
        {
            var usage = await _azureMonitoringService.GetResourceUsageAsync(id);
            return Ok(usage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting usage stats for resource {ResourceId}", id);
            return BadRequest("Failed to get resource usage");
        }
    }

    [HttpGet("projects/{id}/cost")]
    public async Task<ActionResult<decimal>> GetProjectCost(int id)
    {
        try
        {
            var cost = await _azureMonitoringService.GetProjectCostAsync(id, DateTime.UtcNow.AddDays(-30), DateTime.UtcNow);
            return Ok(new { currentMonthlyCost = cost });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cost for project {ProjectId}", id);
            return BadRequest("Failed to get project cost");
        }
    }

    [HttpPost("metrics/update")]
    public async Task<ActionResult> UpdateMetrics()
    {
        try
        {
            await _azureMonitoringService.UpdateResourceMetricsAsync(1); // TODO: Get actual project ID
            return Ok(new { message = "Metrics update initiated" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating metrics");
            return BadRequest("Failed to update metrics");
        }
    }

    [HttpDelete("credentials/{id}")]
    public async Task<ActionResult> DeleteAzureCredentials(int id, [FromQuery] bool confirmed = false)
    {
        try
        {
            var credentials = await _unitOfWork.UserAzureCredentials.GetByIdWithIncludesAsync(id, c => c.Projects);

            if (credentials == null)
                return NotFound();

            if (!confirmed)
            {
                var activeProjects = credentials.Projects.Where(p => p.Status == ProjectStatus.Active).Count();
                
                return Ok(new CredentialDeleteConfirmationResponse
                {
                    RequiresConfirmation = true,
                    SubscriptionName = credentials.SubscriptionName,
                    ActiveProjectCount = activeProjects,
                    Message = $"Are you sure you want to delete credentials for subscription '{credentials.SubscriptionName}'? This will affect {activeProjects} active projects.",
                    Warning = activeProjects > 0 ? "Deleting these credentials will prevent Easel from managing resources in the associated projects." : null
                });
            }

            // User confirmed deletion
            await _unitOfWork.UserAzureCredentials.DeleteAsync(credentials);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new { message = "Azure credentials deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Azure credentials {CredentialId}", id);
            return StatusCode(500, new { message = "Failed to delete Azure credentials" });
        }
    }

    [HttpPost("service-principal/create")]
    public async Task<ActionResult<ServicePrincipalCreationResult>> CreateServicePrincipal(CreateServicePrincipalRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Validate the request
            if (string.IsNullOrEmpty(request.SubscriptionId) || 
                string.IsNullOrEmpty(request.DisplayName) ||
                string.IsNullOrEmpty(request.AccessToken))
            {
                return BadRequest(new { message = "SubscriptionId, DisplayName, and AccessToken are required" });
            }

            _logger.LogInformation("Creating service principal for user {UserId}, subscription {SubscriptionId}", 
                userId, request.SubscriptionId);

            var result = await _servicePrincipalService.CreateServicePrincipalAsync(request, userId);

            if (result.Success)
            {
                _logger.LogInformation("Service principal created successfully for user {UserId}", userId);
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Service principal creation failed for user {UserId}: {Error}", 
                    userId, result.ErrorMessage);
                return BadRequest(new { message = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating service principal for user");
            return StatusCode(500, new { message = "Failed to create service principal" });
        }
    }

    [HttpPost("service-principal/validate-token")]
    public async Task<ActionResult<bool>> ValidateToken(ValidateTokenRequest request)
    {
        try
        {
            var isValid = await _servicePrincipalService.ValidateUserAzureAccessAsync(request.AccessToken);
            return Ok(new { isValid });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Azure token");
            return StatusCode(500, new { message = "Failed to validate token" });
        }
    }

    [HttpPost("token/validate")]
    public async Task<ActionResult<bool>> ValidateTokenAlternate(ValidateTokenRequest request)
    {
        try
        {
            var isValid = await _servicePrincipalService.ValidateUserAzureAccessAsync(request.AccessToken);
            return Ok(new { isValid });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Azure token");
            return StatusCode(500, new { message = "Failed to validate token" });
        }
    }

    [HttpPost("credentials/{credentialId}/assign-contributor-role")]
    public async Task<ActionResult<RoleAssignmentResult>> AssignContributorRole(int credentialId, AssignRoleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Assigning Contributor role to credential {CredentialId} for user {UserId}", 
                credentialId, userId);

            var result = await _servicePrincipalService.AssignContributorRoleToExistingCredentialAsync(
                credentialId, request.AccessToken, userId);

            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Role assignment failed for credential {CredentialId}: {Error}", 
                    credentialId, result.ErrorMessage);
                return BadRequest(new { message = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning Contributor role to credential {CredentialId}", credentialId);
            return StatusCode(500, new { message = "Failed to assign role" });
        }
    }

    [HttpPost("test/credentials/{credentialId}/assign-contributor-role")]
    [AllowAnonymous]
    public async Task<ActionResult<RoleAssignmentResult>> TestAssignContributorRole(int credentialId, AssignRoleRequest request)
    {
        try
        {
            int userId = 1; // Hardcoded for testing
            _logger.LogInformation("TEST: Assigning Contributor role to credential {CredentialId} for user {UserId}", 
                credentialId, userId);

            var result = await _servicePrincipalService.AssignContributorRoleToExistingCredentialAsync(
                credentialId, request.AccessToken, userId);

            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("TEST: Role assignment failed for credential {CredentialId}: {Error}", 
                    credentialId, result.ErrorMessage);
                return BadRequest(new { message = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TEST: Error assigning Contributor role to credential {CredentialId}", credentialId);
            return StatusCode(500, new { message = "Failed to assign role" });
        }
    }

    [HttpGet("credentials/{id}/role-check")]
    public async Task<ActionResult<ContributorRoleCheckResult>> CheckContributorRole(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Checking Contributor role for credential {CredentialId} and user {UserId}", id, userId);

            var result = await _servicePrincipalService.CheckContributorRoleAsync(id, userId);
            
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Role check failed for credential {CredentialId}: {Error}", id, result.ErrorMessage);
                return BadRequest(new { message = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Contributor role for credential {CredentialId}", id);
            return StatusCode(500, new { message = "Failed to check role" });
        }
    }

    [HttpPost("credentials/{credentialId}/elevate-permissions")]
    public async Task<ActionResult<RoleAssignmentResult>> ElevateServicePrincipalPermissions(int credentialId, AssignRoleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Elevating permissions for credential {CredentialId} for user {UserId}", 
                credentialId, userId);

            var result = await _servicePrincipalService.ElevateServicePrincipalPermissionsAsync(
                credentialId, request.AccessToken, userId);

            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Permission elevation failed for credential {CredentialId}: {Error}", 
                    credentialId, result.ErrorMessage);
                return BadRequest(new { message = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error elevating permissions for credential {CredentialId}", credentialId);
            return StatusCode(500, new { message = "Failed to elevate permissions" });
        }
    }
}


public class CredentialDeleteConfirmationResponse
{
    public bool RequiresConfirmation { get; set; }
    public string SubscriptionName { get; set; } = string.Empty;
    public int ActiveProjectCount { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Warning { get; set; }
}

public class ValidateTokenRequest
{
    public string AccessToken { get; set; } = string.Empty;
}

public class AssignRoleRequest
{
    public string AccessToken { get; set; } = string.Empty;
}
