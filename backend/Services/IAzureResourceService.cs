using backend.Models;

namespace backend.Services;

public interface IAzureResourceService
{
    Task<bool> ValidateAzureCredentialsAsync(UserAzureCredential credentials);
    Task<bool> ProvisionResourcesAsync(int projectId, List<AzureResourceRecommendation> recommendations);
    Task<List<AzureResource>> GetProjectResourcesAsync(int projectId);
    Task<ResourceDeletionResponse> DeleteResourceAsync(int resourceId, bool confirmed = false);
    Task<List<string>> GetAvailableLocationsAsync(int credentialId);
}

public class ResourceDeletionResponse
{
    public bool Success { get; set; }
    public bool RequiresConfirmation { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Warning { get; set; }
    public string? ResourceName { get; set; }
    public string? ResourceType { get; set; }
}