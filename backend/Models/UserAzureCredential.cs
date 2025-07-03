using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class UserAzureCredential
{
    public int Id { get; set; }
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    [Required]
    public string SubscriptionId { get; set; } = string.Empty;
    
    [Required]
    public string TenantId { get; set; } = string.Empty;
    
    [Required]
    public string ClientId { get; set; } = string.Empty; // Service Principal ID
    
    [Required]
    public string ClientSecret { get; set; } = string.Empty; // Encrypted
    
    public string SubscriptionName { get; set; } = string.Empty;
    
    /// <summary>
    /// User-friendly name for this credential set (e.g., "Work Account", "Personal", "Dev Environment")
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;
    
    /// <summary>
    /// Whether this is the user's default/primary subscription for new projects
    /// </summary>
    public bool IsDefault { get; set; } = false;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime LastValidated { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Projects that use this Azure subscription
    /// </summary>
    public List<Project> Projects { get; set; } = new();
    
    /// <summary>
    /// Azure regions/locations available for this subscription
    /// </summary>
    public string AvailableRegions { get; set; } = string.Empty; // JSON array of regions
    
    /// <summary>
    /// Last known subscription limits/quotas for resource planning
    /// </summary>
    public string SubscriptionLimits { get; set; } = string.Empty; // JSON object
    
    /// <summary>
    /// Error message from last validation attempt
    /// </summary>
    public string? ErrorMessage { get; set; }
}