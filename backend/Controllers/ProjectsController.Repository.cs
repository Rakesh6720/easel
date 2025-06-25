using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;
using backend.Repositories;

namespace backend.Controllers;

/// <summary>
/// Example ProjectsController using the Repository pattern
/// This shows how to refactor existing controllers to use the IUnitOfWork
/// 
/// To use this version:
/// 1. Rename this file to ProjectsController.cs
/// 2. Rename the existing ProjectsController.cs to ProjectsController.Old.cs
/// 3. Update any missing methods from the original implementation
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProjectsRepositoryController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRequirementAnalysisService _requirementAnalysisService;
    private readonly IAzureResourceService _azureResourceService;
    private readonly ILogger<ProjectsRepositoryController> _logger;

    public ProjectsRepositoryController(
        IUnitOfWork unitOfWork,
        IRequirementAnalysisService requirementAnalysisService,
        IAzureResourceService azureResourceService,
        ILogger<ProjectsRepositoryController> logger)
    {
        _unitOfWork = unitOfWork;
        _requirementAnalysisService = requirementAnalysisService;
        _azureResourceService = azureResourceService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<Project>>> GetProjects()
    {
        try
        {
            // Using repository pattern - much cleaner than direct EF queries
            var projects = await _unitOfWork.Projects.GetAllWithIncludesAsync(p => p.Resources);
            
            // Sort by UpdatedAt descending
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
            // Using repository pattern with includes
            var project = await _unitOfWork.Projects.GetByIdWithIncludesAsync(id,
                p => p.Resources,
                p => p.Conversations,
                p => p.UserAzureCredential);

            if (project == null)
            {
                return NotFound($"Project with ID {id} not found");
            }

            return Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving project {ProjectId}", id);
            return StatusCode(500, "An error occurred while retrieving the project");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject(Project project)
    {
        try
        {
            // Set timestamps
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;

            // Add using repository
            await _unitOfWork.Projects.AddAsync(project);
            await _unitOfWork.SaveChangesAsync();

            // Return the created project with a location header
            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project");
            return StatusCode(500, "An error occurred while creating the project");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, Project project)
    {
        if (id != project.Id)
        {
            return BadRequest("Project ID mismatch");
        }

        try
        {
            // Check if project exists
            var existingProject = await _unitOfWork.Projects.GetByIdAsync(id);
            if (existingProject == null)
            {
                return NotFound($"Project with ID {id} not found");
            }

            // Update properties (in a real scenario, you might use AutoMapper or similar)
            existingProject.Name = project.Name;
            existingProject.Description = project.Description;
            existingProject.UserRequirements = project.UserRequirements;
            existingProject.ProcessedRequirements = project.ProcessedRequirements;
            existingProject.Status = project.Status;
            existingProject.UpdatedAt = DateTime.UtcNow;

            // Update using repository
            await _unitOfWork.Projects.UpdateAsync(existingProject);
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
    public async Task<IActionResult> DeleteProject(int id)
    {
        try
        {
            // Using transaction for cascading deletes
            await _unitOfWork.BeginTransactionAsync();

            var project = await _unitOfWork.Projects.GetByIdWithIncludesAsync(id, p => p.Resources);
            if (project == null)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return NotFound($"Project with ID {id} not found");
            }

            // Delete related resources first (if needed)
            if (project.Resources.Any())
            {
                await _unitOfWork.AzureResources.DeleteRangeAsync(project.Resources);
            }

            // Delete the project
            await _unitOfWork.Projects.DeleteAsync(project);
            await _unitOfWork.SaveChangesAsync();
            
            await _unitOfWork.CommitTransactionAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            _logger.LogError(ex, "Error deleting project {ProjectId}", id);
            return StatusCode(500, "An error occurred while deleting the project");
        }
    }

    [HttpPost("{id}/analyze")]
    public async Task<ActionResult<Project>> AnalyzeProject(int id)
    {
        try
        {
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
            {
                return NotFound($"Project with ID {id} not found");
            }

            // Analyze requirements using the service
            var processedRequirements = await _requirementAnalysisService.AnalyzeRequirementsAsync(project.UserRequirements);
            
            // Update project
            project.ProcessedRequirements = processedRequirements;
            project.Status = ProjectStatus.ResourcesIdentified;
            project.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Projects.UpdateAsync(project);
            await _unitOfWork.SaveChangesAsync();

            return Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing project {ProjectId}", id);
            return StatusCode(500, "An error occurred while analyzing the project");
        }
    }

    [HttpGet("{id}/resources")]
    public async Task<ActionResult<List<AzureResource>>> GetProjectResources(int id)
    {
        try
        {
            // Check if project exists
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
            {
                return NotFound($"Project with ID {id} not found");
            }

            // Get resources using specialized query
            var resources = await _unitOfWork.GetProjectResourcesAsync(id);
            
            return Ok(resources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving resources for project {ProjectId}", id);
            return StatusCode(500, "An error occurred while retrieving project resources");
        }
    }

    [HttpGet("{id}/conversations")]
    public async Task<ActionResult<List<ProjectConversation>>> GetProjectConversations(int id, [FromQuery] int? limit = 50)
    {
        try
        {
            // Check if project exists
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
            {
                return NotFound($"Project with ID {id} not found");
            }

            // Get conversations using specialized query
            var conversations = await _unitOfWork.GetProjectConversationsAsync(id, limit);
            
            return Ok(conversations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving conversations for project {ProjectId}", id);
            return StatusCode(500, "An error occurred while retrieving project conversations");
        }
    }

    [HttpPost("{id}/conversations")]
    public async Task<ActionResult<ProjectConversation>> AddConversation(int id, [FromBody] ProjectConversation conversation)
    {
        try
        {
            // Validate project exists
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
            {
                return NotFound($"Project with ID {id} not found");
            }

            // Set conversation properties
            conversation.ProjectId = id;
            conversation.CreatedAt = DateTime.UtcNow;

            // Add conversation
            await _unitOfWork.ProjectConversations.AddAsync(conversation);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProjectConversations), new { id }, conversation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding conversation to project {ProjectId}", id);
            return StatusCode(500, "An error occurred while adding the conversation");
        }
    }

    // Example of using repository pattern for complex queries
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<Project>>> GetUserProjects(int userId)
    {
        try
        {
            // Using specialized query from UnitOfWork
            var projects = await _unitOfWork.GetUserProjectsAsync(userId);
            
            return Ok(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving projects for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving user projects");
        }
    }

    // Example of using repository pattern with paging
    [HttpGet("paged")]
    public async Task<ActionResult<object>> GetProjectsPaged([FromQuery] int page = 1, [FromQuery] int size = 10)
    {
        try
        {
            if (page < 1) page = 1;
            if (size < 1 || size > 100) size = 10;

            var skip = (page - 1) * size;
            
            // Get total count
            var totalCount = await _unitOfWork.Projects.CountAsync();
            
            // Get paged results with ordering
            var projects = await _unitOfWork.Projects.GetPagedOrderedAsync(
                p => p.UpdatedAt, 
                skip, 
                size, 
                ascending: false);

            var result = new
            {
                Data = projects,
                Page = page,
                Size = size,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / size)
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving paged projects");
            return StatusCode(500, "An error occurred while retrieving projects");
        }
    }
}