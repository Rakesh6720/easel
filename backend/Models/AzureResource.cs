using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class AzureResource
{
    public int Id { get; set; }
    
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    
    [Required]
    public string ResourceType { get; set; } = string.Empty;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string ResourceGroupName { get; set; } = string.Empty;
    
    public string Location { get; set; } = string.Empty;
    
    public string Configuration { get; set; } = "{}"; // JSON configuration
    
    public ResourceStatus Status { get; set; } = ResourceStatus.Planned;
    
    public string? AzureResourceId { get; set; }
    
    public decimal EstimatedMonthlyCost { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ProvisionedAt { get; set; }
    
    public DateTime? DeletedAt { get; set; }
    
    public List<ResourceMetric> Metrics { get; set; } = new();
}

public enum ResourceStatus
{
    Planned,
    Provisioning,
    Active,
    Failed,
    Deleting,
    Deleted
}