using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly EaselDbContext _context;
    private readonly IRequirementAnalysisService _requirementAnalysisService;
    private readonly IAzureResourceService _azureResourceService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(
        EaselDbContext context,
        IRequirementAnalysisService requirementAnalysisService,
        IAzureResourceService azureResourceService,
        ILogger<ProjectsController> logger)
    {
        _context = context;
        _requirementAnalysisService = requirementAnalysisService;
        _azureResourceService = azureResourceService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<Project>>> GetProjects()
    {
        var projects = await _context.Projects
            .Include(p => p.Resources)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetProject(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Resources)
            .Include(p => p.Conversations)
            .Include(p => p.UserAzureCredential)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
            return NotFound();

        return Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject(CreateProjectRequest request)
    {
        try
        {
            var project = await _requirementAnalysisService.CreateProjectFromRequirementsAsync(
                request.UserRequirements, 
                request.Name);

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
        var conversations = await _context.ProjectConversations
            .Where(c => c.ProjectId == id)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return Ok(conversations);
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

    [HttpPost("{id}/provision")]
    public async Task<ActionResult> ProvisionResources(int id, ProvisionResourcesRequest request)
    {
        try
        {
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
        var resources = await _azureResourceService.GetProjectResourcesAsync(id);
        return Ok(resources);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateProject(int id, UpdateProjectRequest request)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
            return NotFound();

        project.Name = request.Name ?? project.Name;
        project.Description = request.Description ?? project.Description;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProject(int id, [FromQuery] bool confirmed = false)
    {
        var project = await _context.Projects
            .Include(p => p.Resources)
            .FirstOrDefaultAsync(p => p.Id == id);

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

        // User has confirmed deletion
        foreach (var resource in project.Resources.Where(r => r.Status == ResourceStatus.Active))
        {
            await _azureResourceService.DeleteResourceAsync(resource.Id, true);
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Project '{project.Name}' and its resources have been deleted successfully." });
    }
}

[ApiController]
[Route("api/resources")]
public class ResourcesController : ControllerBase
{
    private readonly IAzureResourceService _azureResourceService;
    private readonly EaselDbContext _context;
    private readonly ILogger<ResourcesController> _logger;

    public ResourcesController(
        IAzureResourceService azureResourceService,
        EaselDbContext context,
        ILogger<ResourcesController> logger)
    {
        _azureResourceService = azureResourceService;
        _context = context;
        _logger = logger;
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteResource(int id, [FromQuery] bool confirmed = false)
    {
        var resource = await _context.AzureResources.FindAsync(id);
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
}

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string UserRequirements { get; set; } = string.Empty;
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