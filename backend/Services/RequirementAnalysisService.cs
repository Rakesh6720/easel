using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Services;

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
                Status = ProjectStatus.Analyzing,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Generate initial follow-up questions using Azure OpenAI
            var followUpQuestions = await _openAiService.GenerateFollowUpQuestionsAsync(processedRequirements);
            
            _logger.LogInformation("Successfully created project {ProjectName} with ID {ProjectId}", projectName, project.Id);
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

            // Combine previous context with new message for Azure OpenAI
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
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Processed conversation for project {ProjectId}", projectId);
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

            _logger.LogInformation("Generating Azure resource recommendations for project {ProjectId}", projectId);

            // Use Azure OpenAI to generate resource recommendations
            var recommendations = await _openAiService.RecommendAzureResourcesAsync(project.ProcessedRequirements ?? project.UserRequirements);

            // Validate and enhance recommendations
            foreach (var recommendation in recommendations)
            {
                ValidateRecommendation(recommendation);
            }

            // Update project status
            project.Status = ProjectStatus.ResourcesIdentified;
            project.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Generated {Count} resource recommendations for project {ProjectId}", 
                recommendations.Count, projectId);

            return recommendations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating resource recommendations for project {ProjectId}", projectId);
            throw;
        }
    }

    private void ValidateRecommendation(AzureResourceRecommendation recommendation)
    {
        // Ensure recommendation has required fields
        if (string.IsNullOrWhiteSpace(recommendation.Name))
        {
            recommendation.Name = $"resource-{Guid.NewGuid().ToString()[..8]}";
        }

        if (string.IsNullOrWhiteSpace(recommendation.Location))
        {
            recommendation.Location = "East US";
        }

        if (recommendation.EstimatedMonthlyCost <= 0)
        {
            recommendation.EstimatedMonthlyCost = EstimateBaseCost(recommendation.ResourceType);
        }
    }

    private decimal EstimateBaseCost(string resourceType)
    {
        return resourceType.ToLower() switch
        {
            "microsoft.web/sites" => 13.14m,
            "microsoft.web/serverfarms" => 13.14m,
            "microsoft.storage/storageaccounts" => 5.00m,
            "microsoft.sql/servers/databases" => 4.99m,
            "microsoft.insights/components" => 0.00m,
            "microsoft.cache/redis" => 15.00m,
            _ => 10.00m
        };
    }
}