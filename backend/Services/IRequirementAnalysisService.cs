using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IRequirementAnalysisService
{
    Task<Project> CreateProjectFromRequirementsAsync(string userRequirements, string projectName, int userId, int? azureCredentialId = null);
    Task<string> ProcessConversationAsync(int projectId, string userMessage);
    Task<List<AzureResourceRecommendation>> GenerateResourceRecommendationsAsync(int projectId);
}

// Implementation moved to separate RequirementAnalysisService.cs file