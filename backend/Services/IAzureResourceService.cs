using backend.Models;

namespace backend.Services;

public interface IAzureResourceService
{
    Task<bool> ValidateAzureCredentialsAsync(UserAzureCredential credentials);
    Task<bool> ProvisionResourcesAsync(int projectId, List<AzureResourceRecommendation> recommendations);
    Task<bool> RetryResourceAsync(int resourceId);
    Task<List<AzureResource>> GetProjectResourcesAsync(int projectId);
    Task<ResourceDeletionResponse> DeleteResourceAsync(int resourceId, bool confirmed = false);
    Task<List<string>> GetAvailableLocationsAsync(int credentialId);
    Task<AzureRoleCheckResult> CheckSubscriptionRoleAsync(int credentialId);
}

public class AzureRoleCheckResult
{
    public bool HasContributorRole { get; set; }
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> AssignedRoles { get; set; } = new();
    public string? ErrorMessage { get; set; }
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