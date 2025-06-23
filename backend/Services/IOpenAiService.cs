namespace backend.Services;

public interface IOpenAiService
{
    Task<string> AnalyzeRequirementsAsync(string userInput);
    Task<string> GenerateFollowUpQuestionsAsync(string requirements);
    Task<List<AzureResourceRecommendation>> RecommendAzureResourcesAsync(string processedRequirements);
}

public class AzureResourceRecommendation
{
    public string ResourceType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public Dictionary<string, object> Configuration { get; set; } = new();
    public decimal EstimatedMonthlyCost { get; set; }
    public string Reasoning { get; set; } = string.Empty;
}