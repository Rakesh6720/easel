using OpenAI;
using OpenAI.Chat;
using System.Text.Json;

namespace backend.Services;

public class OpenAiService : IOpenAiService
{
    private readonly OpenAIClient _client;
    private readonly ILogger<OpenAiService> _logger;

    public OpenAiService(IConfiguration configuration, ILogger<OpenAiService> logger)
    {
        var apiKey = configuration["OpenAI:ApiKey"] ?? throw new ArgumentException("OpenAI API key not configured");
        _client = new OpenAIClient(apiKey);
        _logger = logger;
    }

    public async Task<string> AnalyzeRequirementsAsync(string userInput)
    {
        var systemPrompt = @"
You are an expert Azure cloud architect. Analyze the user's application requirements and provide a structured analysis.

Extract and identify:
1. Application type and purpose
2. Expected user load and scalability requirements
3. Data storage needs
4. Security and compliance requirements
5. Integration requirements
6. Performance requirements
7. Budget considerations (if mentioned)

Provide your analysis in a clear, structured format that can be used to recommend Azure resources.
";

        try
        {
            var response = await _client.GetChatClient("gpt-4").CompleteChatAsync(
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
            var response = await _client.GetChatClient("gpt-4").CompleteChatAsync(
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
You are an expert Azure cloud architect. Based on the processed requirements, recommend specific Azure resources with detailed configurations.

For each resource, provide:
1. Resource type (exact Azure resource type like 'Microsoft.Web/sites', 'Microsoft.Storage/storageAccounts')
2. Suggested name (following Azure naming conventions)
3. Recommended location (default to 'East US' unless specified)
4. Detailed configuration as JSON object
5. Estimated monthly cost in USD (realistic pricing)
6. Brief reasoning for the recommendation

IMPORTANT: Provide realistic configurations that match Azure's actual resource options.

Resource Types to Consider:
- Microsoft.Web/serverfarms (App Service Plans)
- Microsoft.Web/sites (App Services/Web Apps)
- Microsoft.Storage/storageAccounts (Storage Accounts)
- Microsoft.Sql/servers/databases (SQL Databases)
- Microsoft.Insights/components (Application Insights)
- Microsoft.Cache/Redis (Redis Cache)

Configuration Examples:
App Service: { ""sku"": { ""name"": ""B1"", ""tier"": ""Basic"", ""size"": ""B1"", ""family"": ""B"", ""capacity"": 1 }, ""kind"": ""app"", ""httpsOnly"": true, ""alwaysOn"": true }
Storage: { ""sku"": { ""name"": ""Standard_LRS"" }, ""accessTier"": ""Hot"", ""enableHttpsTrafficOnly"": true }
SQL Database: { ""sku"": { ""name"": ""Basic"", ""tier"": ""Basic"" }, ""collation"": ""SQL_Latin1_General_CP1_CI_AS"", ""maxSizeBytes"": 2147483648 }

Respond with a JSON array of resource recommendations:

[
  {
    ""resourceType"": ""Microsoft.Web/serverfarms"",
    ""name"": ""myapp-plan"",
    ""location"": ""East US"",
    ""configuration"": {
      ""sku"": {
        ""name"": ""B1"",
        ""tier"": ""Basic"",
        ""size"": ""B1"",
        ""family"": ""B"",
        ""capacity"": 1
      },
      ""kind"": ""app""
    },
    ""estimatedMonthlyCost"": 13.14,
    ""reasoning"": ""Basic App Service plan for hosting web applications with moderate traffic""
  }
]
";

        try
        {
            var response = await _client.GetChatClient("gpt-4").CompleteChatAsync(
                new ChatMessage[]
                {
                    new SystemChatMessage(systemPrompt),
                    new UserChatMessage(processedRequirements)
                });

            var jsonResponse = response.Value.Content[0].Text;
            
            // Clean up the response to extract just the JSON
            var startIndex = jsonResponse.IndexOf('[');
            var endIndex = jsonResponse.LastIndexOf(']') + 1;
            
            if (startIndex >= 0 && endIndex > startIndex)
            {
                jsonResponse = jsonResponse.Substring(startIndex, endIndex - startIndex);
            }

            var recommendations = JsonSerializer.Deserialize<List<AzureResourceRecommendation>>(jsonResponse, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return recommendations ?? new List<AzureResourceRecommendation>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recommending Azure resources with OpenAI");
            throw;
        }
    }
}