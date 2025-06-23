using backend.Models;

namespace backend.Services;

public interface IRequirementAnalysisService
{
    Task<Project> CreateProjectFromRequirementsAsync(string userRequirements, string projectName);
    Task<string> ProcessConversationAsync(int projectId, string userMessage);
    Task<List<AzureResourceRecommendation>> GenerateResourceRecommendationsAsync(int projectId);
}

public class RequirementAnalysisService : IRequirementAnalysisService
{
    private readonly IOpenAiService _openAiService;
    private readonly EaselDbContext _context;
    private readonly ILogger<RequirementAnalysisService> _logger;

    public RequirementAnalysisService(
        IOpenAiService openAiService,
        EaselDbContext context,
        ILogger<RequirementAnalysisService> logger)
    {
        _openAiService = openAiService;
        _context = context;
        _logger = logger;
    }

    public async Task<Project> CreateProjectFromRequirementsAsync(string userRequirements, string projectName)
    {
        try
        {
            _logger.LogInformation("Creating project from requirements: {ProjectName}", projectName);

            var processedRequirements = await _openAiService.AnalyzeRequirementsAsync(userRequirements);
            
            var project = new Project
            {
                Name = projectName,
                UserRequirements = userRequirements,
                ProcessedRequirements = processedRequirements,
                Status = ProjectStatus.Analyzing
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Generate initial follow-up questions
            var followUpQuestions = await _openAiService.GenerateFollowUpQuestionsAsync(processedRequirements);
            
            var conversation = new ProjectConversation
            {
                ProjectId = project.Id,
                UserMessage = userRequirements,
                AssistantResponse = $"I've analyzed your requirements. Here are some follow-up questions to better understand your needs:\n\n{followUpQuestions}"
            };

            _context.ProjectConversations.Add(conversation);
            await _context.SaveChangesAsync();

            return project;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project from requirements");
            throw;
        }
    }

    public async Task<string> ProcessConversationAsync(int projectId, string userMessage)
    {
        try
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                throw new ArgumentException("Project not found");

            // Combine previous context with new message
            var contextBuilder = new System.Text.StringBuilder();
            contextBuilder.AppendLine($"Original Requirements: {project.UserRequirements}");
            contextBuilder.AppendLine($"Processed Requirements: {project.ProcessedRequirements}");
            contextBuilder.AppendLine($"New User Input: {userMessage}");

            var response = await _openAiService.AnalyzeRequirementsAsync(contextBuilder.ToString());

            // Update project requirements if needed
            if (!string.IsNullOrEmpty(response))
            {
                project.ProcessedRequirements = response;
                project.UpdatedAt = DateTime.UtcNow;
            }

            var conversation = new ProjectConversation
            {
                ProjectId = projectId,
                UserMessage = userMessage,
                AssistantResponse = response
            };

            _context.ProjectConversations.Add(conversation);
            await _context.SaveChangesAsync();

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing conversation for project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<List<AzureResourceRecommendation>> GenerateResourceRecommendationsAsync(int projectId)
    {
        try
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                throw new ArgumentException("Project not found");

            var recommendations = await _openAiService.RecommendAzureResourcesAsync(project.ProcessedRequirements);

            // Update project status
            project.Status = ProjectStatus.ResourcesIdentified;
            project.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return recommendations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating resource recommendations for project {ProjectId}", projectId);
            throw;
        }
    }
}