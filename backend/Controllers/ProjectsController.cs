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
public class ProjectsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRequirementAnalysisService _requirementAnalysisService;
    private readonly IAzureResourceService _azureResourceService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(
        IUnitOfWork unitOfWork,
        IRequirementAnalysisService requirementAnalysisService,
        IAzureResourceService azureResourceService,
        ILogger<ProjectsController> logger)
    {
        _unitOfWork = unitOfWork;
        _requirementAnalysisService = requirementAnalysisService;
        _azureResourceService = azureResourceService;
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

    [HttpGet]
    public async Task<ActionResult<List<Project>>> GetProjects()
    {
        try
        {
            var userId = GetCurrentUserId();
            var projects = await _unitOfWork.GetUserProjectsAsync(userId);
            var sortedProjects = projects.OrderByDescending(p => p.UpdatedAt).ToList();
            return Ok(sortedProjects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving projects");
            return StatusCode(500, "An error occurred while retrieving projects");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetProject(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var project = await _unitOfWork.Projects.GetByIdWithIncludesAsync(id,
                p => p.Resources,
                p => p.Conversations,
                p => p.UserAzureCredential);

            if (project == null || project.UserId != userId)
                return NotFound();

            return Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving project {ProjectId}", id);
            return StatusCode(500, "An error occurred while retrieving the project");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject(CreateProjectRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Validate Azure credential if provided
            if (request.AzureCredentialId.HasValue)
            {
                var credential = await _unitOfWork.UserAzureCredentials.GetByIdAsync(request.AzureCredentialId.Value);
                    
                if (credential == null || credential.UserId != userId || !credential.IsActive)
                {
                    return BadRequest("Invalid or inactive Azure credential specified");
                }
            }
            
            var project = await _requirementAnalysisService.CreateProjectFromRequirementsAsync(
                request.UserRequirements, 
                request.Name,
                userId,
                request.AzureCredentialId);

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project");
            return BadRequest("Failed to create project");
        }
    }

    [HttpPost("{id}/conversation")]
    public async Task<ActionResult<string>> AddConversation(int id, ConversationRequest request)
    {
        try
        {
            var response = await _requirementAnalysisService.ProcessConversationAsync(id, request.Message);
            return Ok(new { response });
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing conversation for project {ProjectId}", id);
            return BadRequest("Failed to process conversation");
        }
    }

    [HttpGet("{id}/conversations")]
    public async Task<ActionResult<List<ProjectConversation>>> GetConversations(int id)
    {
        try
        {
            // Validate project exists
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return NotFound();

            var conversations = await _unitOfWork.GetProjectConversationsAsync(id);
            return Ok(conversations.OrderBy(c => c.CreatedAt).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving conversations for project {ProjectId}", id);
            return StatusCode(500, "An error occurred while retrieving conversations");
        }
    }

    [HttpPost("{id}/generate-recommendations")]
    public async Task<ActionResult<List<AzureResourceRecommendation>>> GenerateRecommendations(int id)
    {
        try
        {
            var recommendations = await _requirementAnalysisService.GenerateResourceRecommendationsAsync(id);
            return Ok(recommendations);
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating recommendations for project {ProjectId}", id);
            return BadRequest("Failed to generate recommendations");
        }
    }

    [HttpPost("{id}/resources/{resourceId}/retry")]
    public async Task<ActionResult> RetryResource(int id, int resourceId)
    {
        try
        {
            _logger.LogInformation("Received retry request for resource {ResourceId} in project {ProjectId}", resourceId, id);
            
            var success = await _azureResourceService.RetryResourceAsync(resourceId);
            
            if (success)
                return Ok(new { message = "Resource retry completed successfully" });
            else
                return BadRequest("Failed to retry resource");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrying resource {ResourceId} in project {ProjectId}", resourceId, id);
            return BadRequest("Failed to retry resource");
        }
    }

    [HttpPost("{id}/provision")]
    public async Task<ActionResult> ProvisionResources(int id, ProvisionResourcesRequest request)
    {
        try
        {
            _logger.LogInformation("Received provision request for project {ProjectId}", id);
            _logger.LogInformation("Request data: {RequestData}", System.Text.Json.JsonSerializer.Serialize(request));
            
            var success = await _azureResourceService.ProvisionResourcesAsync(id, request.Recommendations);
            
            if (success)
                return Ok(new { message = "Resources provisioning started successfully" });
            else
                return BadRequest("Failed to start resource provisioning");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error provisioning resources for project {ProjectId}", id);
            return BadRequest("Failed to provision resources");
        }
    }

    [HttpGet("{id}/resources")]
    public async Task<ActionResult<List<AzureResource>>> GetProjectResources(int id)
    {
        try
        {
            // Validate project exists using repository
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return NotFound();

            var resources = await _azureResourceService.GetProjectResourcesAsync(id);
            return Ok(resources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving resources for project {ProjectId}", id);
            return StatusCode(500, "An error occurred while retrieving project resources");
        }
    }

    [HttpPatch("{id}/azure-credential")]
    public async Task<ActionResult> AssignAzureCredential(int id, [FromBody] AssignAzureCredentialRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            
            if (project == null)
                return NotFound("Project not found");
                
            if (project.UserId != userId)
                return Forbid("You can only assign credentials to your own projects");
                
            // Verify the Azure credential exists and belongs to the user
            var credential = await _unitOfWork.UserAzureCredentials.GetByIdAsync(request.AzureCredentialId);
            if (credential == null || credential.UserId != userId)
                return BadRequest("Invalid Azure credential");
                
            if (!credential.IsActive)
                return BadRequest("Azure credential is not active");
                
            project.UserAzureCredentialId = request.AzureCredentialId;
            await _unitOfWork.SaveChangesAsync();
            
            _logger.LogInformation("Assigned Azure credential {CredentialId} to project {ProjectId}", request.AzureCredentialId, id);
            return Ok(new { message = "Azure credential assigned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning Azure credential to project {ProjectId}", id);
            return StatusCode(500, "An error occurred while assigning Azure credential");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateProject(int id, UpdateProjectRequest request)
    {
        try
        {
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return NotFound();

            project.Name = request.Name ?? project.Name;
            project.Description = request.Description ?? project.Description;
            project.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Projects.UpdateAsync(project);
            await _unitOfWork.SaveChangesAsync();
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project {ProjectId}", id);
            return StatusCode(500, "An error occurred while updating the project");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProject(int id, [FromQuery] bool confirmed = false)
    {
        try
        {
            var project = await _unitOfWork.Projects.GetByIdWithIncludesAsync(id, p => p.Resources);

            if (project == null)
                return NotFound();

            if (!confirmed)
            {
                var activeResources = project.Resources.Where(r => r.Status == ResourceStatus.Active).ToList();
                
                return Ok(new DeleteConfirmationResponse
                {
                    RequiresConfirmation = true,
                    ProjectName = project.Name,
                    ActiveResourceCount = activeResources.Count,
                    ActiveResources = activeResources.Select(r => new ResourceSummary
                    {
                        Id = r.Id,
                        Name = r.Name,
                        ResourceType = r.ResourceType,
                        EstimatedMonthlyCost = r.EstimatedMonthlyCost
                    }).ToList(),
                    Message = $"Are you sure you want to delete project '{project.Name}'? This will delete {activeResources.Count} active Azure resources in your subscription.",
                    EstimatedMonthlySavings = activeResources.Sum(r => r.EstimatedMonthlyCost)
                });
            }

            // User has confirmed deletion - use transaction
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // Delete Azure resources first
                foreach (var resource in project.Resources.Where(r => r.Status == ResourceStatus.Active))
                {
                    await _azureResourceService.DeleteResourceAsync(resource.Id, true);
                }

                // Delete project using repository
                await _unitOfWork.Projects.DeleteAsync(project);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return Ok(new { message = $"Project '{project.Name}' and its resources have been deleted successfully." });
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project {ProjectId}", id);
            return StatusCode(500, "An error occurred while deleting the project");
        }
    }
}

[ApiController]
[Route("api/resources")]
public class ResourcesController : ControllerBase
{
    private readonly IAzureResourceService _azureResourceService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ResourcesController> _logger;

    public ResourcesController(
        IAzureResourceService azureResourceService,
        IUnitOfWork unitOfWork,
        ILogger<ResourcesController> logger)
    {
        _azureResourceService = azureResourceService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteResource(int id, [FromQuery] bool confirmed = false)
    {
        try
        {
            var resource = await _unitOfWork.AzureResources.GetByIdAsync(id);
            if (resource == null)
                return NotFound();

            if (!confirmed)
            {
                return Ok(new ResourceDeleteConfirmationResponse
                {
                    RequiresConfirmation = true,
                    ResourceName = resource.Name,
                    ResourceType = resource.ResourceType,
                    EstimatedMonthlyCost = resource.EstimatedMonthlyCost,
                    Message = $"Are you sure you want to delete the Azure resource '{resource.Name}' ({resource.ResourceType})? This action cannot be undone.",
                    Warning = "Deleting this resource will permanently remove it from your Azure subscription and may cause downtime for your application."
                });
            }

            // User has confirmed deletion
            var result = await _azureResourceService.DeleteResourceAsync(id, true);
            
            if (result.Success)
                return Ok(new { message = result.Message });
            else
                return BadRequest(result.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting resource {ResourceId}", id);
            return StatusCode(500, "An error occurred while deleting the resource");
        }
    }
}

// DTO Classes remain the same
public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string UserRequirements { get; set; } = string.Empty;
    public int? AzureCredentialId { get; set; }
}

public class ConversationRequest
{
    public string Message { get; set; } = string.Empty;
}

public class ProvisionResourcesRequest
{
    public List<AzureResourceRecommendation> Recommendations { get; set; } = new();
}

public class UpdateProjectRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class AssignAzureCredentialRequest
{
    public int AzureCredentialId { get; set; }
}

public class DeleteConfirmationResponse
{
    public bool RequiresConfirmation { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int ActiveResourceCount { get; set; }
    public List<ResourceSummary> ActiveResources { get; set; } = new();
    public string Message { get; set; } = string.Empty;
    public decimal EstimatedMonthlySavings { get; set; }
}

public class ResourceDeleteConfirmationResponse
{
    public bool RequiresConfirmation { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public decimal EstimatedMonthlyCost { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Warning { get; set; } = string.Empty;
}

public class ResourceSummary
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public decimal EstimatedMonthlyCost { get; set; }
}