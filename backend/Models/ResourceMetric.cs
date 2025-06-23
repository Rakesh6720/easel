using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class ResourceMetric
{
    public int Id { get; set; }
    
    public int AzureResourceId { get; set; }
    public AzureResource AzureResource { get; set; } = null!;
    
    [Required]
    public string MetricName { get; set; } = string.Empty;
    
    public double Value { get; set; }
    
    public string Unit { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public string? Tags { get; set; } // JSON for additional metadata
}

public class ProjectConversation
{
    public int Id { get; set; }
    
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    
    [Required]
    public string UserMessage { get; set; } = string.Empty;
    
    [Required]
    public string AssistantResponse { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}