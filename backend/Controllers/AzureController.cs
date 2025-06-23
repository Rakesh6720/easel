using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Models;
using backend.Services;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AzureController : ControllerBase
{
    private readonly EaselDbContext _context;
    private readonly IAzureResourceService _azureResourceService;
    private readonly IAzureMonitoringService _azureMonitoringService;
    private readonly ILogger<AzureController> _logger;

    public AzureController(
        EaselDbContext context,
        IAzureResourceService azureResourceService,
        IAzureMonitoringService azureMonitoringService,
        ILogger<AzureController> logger)
    {
        _context = context;
        _azureResourceService = azureResourceService;
        _azureMonitoringService = azureMonitoringService;
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
    public async Task<ActionResult<UserAzureCredential>> AddAzureCredentials(AddAzureCredentialsRequest request)
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
            var existingCredential = await _context.UserAzureCredentials
                .FirstOrDefaultAsync(c => c.UserId == userId && c.SubscriptionId == request.SubscriptionId);
            
            if (existingCredential != null)
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
            var userCredentialCount = await _context.UserAzureCredentials
                .CountAsync(c => c.UserId == userId && c.IsActive);
            
            if (userCredentialCount == 0)
            {
                credentials.IsDefault = true;
            }

            _context.UserAzureCredentials.Add(credentials);
            await _context.SaveChangesAsync();

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
        var credentials = await _context.UserAzureCredentials.FindAsync(id);
        
        if (credentials == null)
            return NotFound();

        // Don't return the client secret
        credentials.ClientSecret = "***";
        
        return Ok(credentials);
    }

    [HttpGet("credentials")]
    public async Task<ActionResult<List<object>>> GetAllAzureCredentials()
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var credentials = await _context.UserAzureCredentials
                .Where(c => c.UserId == userId && c.IsActive)
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
                .ToListAsync();
            
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
        var credentials = await _context.UserAzureCredentials.FindAsync(id);
        
        if (credentials == null)
            return NotFound();

        try
        {
            var isValid = await _azureResourceService.ValidateAzureCredentialsAsync(credentials);
            await _context.SaveChangesAsync();
            
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
            var metrics = await _azureMonitoringService.GetResourceMetricsAsync(id, startTime, endTime);
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
            var usage = await _azureMonitoringService.GetResourceUsageStatsAsync(id);
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
            var cost = await _azureMonitoringService.GetCurrentMonthlyCostAsync(id);
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
            await _azureMonitoringService.UpdateResourceMetricsAsync();
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
        var credentials = await _context.UserAzureCredentials
            .Include(c => c.Projects)
            .FirstOrDefaultAsync(c => c.Id == id);

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
        _context.UserAzureCredentials.Remove(credentials);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Azure credentials deleted successfully" });
    }
}

public class AddAzureCredentialsRequest
{
    public string UserId { get; set; } = string.Empty;
    public string SubscriptionId { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public class CredentialDeleteConfirmationResponse
{
    public bool RequiresConfirmation { get; set; }
    public string SubscriptionName { get; set; } = string.Empty;
    public int ActiveProjectCount { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Warning { get; set; }
}