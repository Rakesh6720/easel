using Azure.AI.OpenAI;
using OpenAI.Chat;
using System.Text.Json;
using Azure;

namespace backend.Services;

public class OpenAiService : IOpenAiService
{
    private readonly AzureOpenAIClient _client;
    private readonly ILogger<OpenAiService> _logger;
    private readonly string _deploymentName;

    public OpenAiService(IConfiguration configuration, ILogger<OpenAiService> logger)
    {
        var endpoint = configuration["AzureOpenAI:Endpoint"] ?? throw new ArgumentException("Azure OpenAI endpoint not configured");
        var apiKey = configuration["AzureOpenAI:ApiKey"] ?? throw new ArgumentException("Azure OpenAI API key not configured");
        _deploymentName = configuration["AzureOpenAI:DeploymentName"] ?? throw new ArgumentException("Azure OpenAI deployment name not configured");
        
        _client = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        _logger = logger;
    }

    public async Task<string> AnalyzeRequirementsAsync(string userInput)
    {
        var systemPrompt = @"
You are a helpful Azure cloud architect assistant. Your goal is to provide practical, conversational, and budget-conscious advice to users building applications on Azure.

IMPORTANT GUIDELINES:
- Be conversational and helpful, not academic or verbose
- ALWAYS address the user's specific questions and constraints directly
- If they mention a budget, provide specific Azure service costs within that budget
- Give actionable recommendations with real pricing
- Ask follow-up questions to better understand their needs
- Be concise but thorough - aim for helpful paragraphs, not essays

When the user provides requirements or asks questions, respond as a knowledgeable consultant who:
1. Directly addresses their specific question or constraint
2. Provides practical Azure resource recommendations with real costs
3. Explains WHY certain services are recommended for their use case
4. Asks clarifying questions to better help them
5. Keeps responses focused and actionable

If they mention budget constraints, prioritize cost-effective solutions and explain how to scale up later.
";

        try
        {
            var response = await _client.GetChatClient(_deploymentName).CompleteChatAsync(
                new ChatMessage[]
                {
                    new SystemChatMessage(systemPrompt),
                    new UserChatMessage(userInput)
                });

            return response.Value.Content[0].Text;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing requirements with OpenAI");
            throw;
        }
    }

    public async Task<string> GenerateFollowUpQuestionsAsync(string requirements)
    {
        var systemPrompt = @"
Based on the analyzed requirements, generate 3-5 specific follow-up questions to better understand the user's needs for Azure resource provisioning.

Focus on areas that need clarification for accurate resource recommendations, such as:
- Specific performance requirements
- Security and compliance needs
- Integration points
- Expected user volumes
- Budget constraints
- Geographic requirements

Format as a simple list of questions.
";

        try
        {
            var response = await _client.GetChatClient(_deploymentName).CompleteChatAsync(
                new ChatMessage[]
                {
                    new SystemChatMessage(systemPrompt),
                    new UserChatMessage(requirements)
                });

            return response.Value.Content[0].Text;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating follow-up questions with OpenAI");
            throw;
        }
    }

    public async Task<List<AzureResourceRecommendation>> RecommendAzureResourcesAsync(string processedRequirements)
    {
        var systemPrompt = @"
You must recommend Azure resources using ONLY these exact resource types:

Microsoft.Web/sites
Microsoft.Web/serverfarms
Microsoft.Sql/servers/databases
Microsoft.Storage/storageAccounts
Microsoft.CosmosDB/databaseAccounts
Microsoft.Insights/components

Example valid response:
[
  {""resourceType"": ""Microsoft.Web/sites"", ""name"": ""my-app"", ""location"": ""East US"", ""configuration"": {""sku"": {""name"": ""B1"", ""tier"": ""Basic""}, ""kind"": ""app""}, ""estimatedMonthlyCost"": 13.14, ""reasoning"": ""Web hosting""},
  {""resourceType"": ""Microsoft.Storage/storageAccounts"", ""name"": ""my-storage"", ""location"": ""East US"", ""configuration"": {""accountType"": ""Standard_LRS""}, ""estimatedMonthlyCost"": 5.00, ""reasoning"": ""File storage""}
]

Return only valid JSON array. No other text.";

        try
        {
            var response = await _client.GetChatClient(_deploymentName).CompleteChatAsync(
                new ChatMessage[]
                {
                    new SystemChatMessage(systemPrompt),
                    new UserChatMessage(processedRequirements)
                });

            var jsonResponse = response.Value.Content[0].Text;
            
            _logger.LogInformation("Raw OpenAI response: {Response}", jsonResponse);
            
            // Clean up the response to extract just the JSON
            var startIndex = jsonResponse.IndexOf('[');
            var endIndex = jsonResponse.LastIndexOf(']') + 1;
            
            if (startIndex >= 0 && endIndex > startIndex)
            {
                jsonResponse = jsonResponse.Substring(startIndex, endIndex - startIndex);
            }
            
            // Additional cleanup to remove comments and fix common JSON issues
            jsonResponse = CleanJsonResponse(jsonResponse);
            
            _logger.LogInformation("Cleaned JSON response: {CleanedResponse}", jsonResponse);

            var recommendations = JsonSerializer.Deserialize<List<AzureResourceRecommendation>>(jsonResponse, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true
            });

            return recommendations ?? new List<AzureResourceRecommendation>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recommending Azure resources with OpenAI");
            throw;
        }
    }
    
    private string CleanJsonResponse(string jsonResponse)
    {
        if (string.IsNullOrEmpty(jsonResponse))
            return jsonResponse;
            
        var lines = jsonResponse.Split('\n');
        var cleanedLines = new List<string>();
        
        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            
            // Skip empty lines
            if (string.IsNullOrEmpty(trimmedLine))
                continue;
                
            // Skip lines that start with // (comments)
            if (trimmedLine.StartsWith("//"))
                continue;
                
            // Remove inline comments (everything after //)
            var commentIndex = trimmedLine.IndexOf("//");
            if (commentIndex > 0)
            {
                trimmedLine = trimmedLine.Substring(0, commentIndex).Trim();
            }
            
            // Skip if line is now empty after comment removal
            if (string.IsNullOrEmpty(trimmedLine))
                continue;
                
            cleanedLines.Add(trimmedLine);
        }
        
        return string.Join("\n", cleanedLines);
    }
}