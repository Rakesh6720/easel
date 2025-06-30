using backend.Models;

namespace backend.Services;

public interface IServicePrincipalService
{
    Task<ServicePrincipalCreationResult> CreateServicePrincipalAsync(CreateServicePrincipalRequest request, int userId);
    Task<bool> ValidateUserAzureAccessAsync(string accessToken);
    Task<RoleAssignmentResult> AssignContributorRoleToExistingCredentialAsync(int credentialId, string accessToken, int userId);
    Task<ContributorRoleCheckResult> CheckContributorRoleAsync(int credentialId, int userId);
    Task<RoleAssignmentResult> ElevateServicePrincipalPermissionsAsync(int credentialId, string accessToken, int userId);
}

public class CreateServicePrincipalRequest
{
    public string SubscriptionId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty; // User's Azure access token
    public bool AutoAssignContributorRole { get; set; } = true;
}

public class ServicePrincipalCreationResult
{
    public bool Success { get; set; }
    public string? ServicePrincipalId { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
    public string? TenantId { get; set; }
    public string? SubscriptionId { get; set; }
    public string? DisplayName { get; set; }
    public bool ContributorRoleAssigned { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> Warnings { get; set; } = new();
}

public class RoleAssignmentResult
{
    public bool Success { get; set; }
    public bool RoleAlreadyAssigned { get; set; }
    public string? ErrorMessage { get; set; }
    public string? Message { get; set; }
}

public class ContributorRoleCheckResult
{
    public bool IsSuccess { get; set; }
    public bool HasContributorRole { get; set; }
    public string? ErrorMessage { get; set; }
    public string? Message { get; set; }
}
