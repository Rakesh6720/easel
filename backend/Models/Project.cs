using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Project
{
    public int Id { get; set; }
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public string UserRequirements { get; set; } = string.Empty;
    
    public string ProcessedRequirements { get; set; } = string.Empty;
    
    public ProjectStatus Status { get; set; } = ProjectStatus.Draft;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public List<AzureResource> Resources { get; set; } = new();
    
    public List<ProjectConversation> Conversations { get; set; } = new();
    
    public int? UserAzureCredentialId { get; set; }
    public UserAzureCredential? UserAzureCredential { get; set; }
}

public enum ProjectStatus
{
    Draft,
    Analyzing,
    ResourcesIdentified,
    Provisioning,
    Active,
    Error,
    Archived
}