using backend.Models;

namespace backend.Repositories;

/// <summary>
/// Unit of Work pattern interface for managing repository instances and transactions
/// </summary>
public interface IUnitOfWork : IDisposable
{
    // Repository properties
    IRepository<User> Users { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    IRepository<Project> Projects { get; }
    IRepository<AzureResource> AzureResources { get; }
    IRepository<ResourceMetric> ResourceMetrics { get; }
    IRepository<ProjectConversation> ProjectConversations { get; }
    IRepository<UserAzureCredential> UserAzureCredentials { get; }
    
    // Transaction management
    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
    
    // Specialized queries (can be moved to specific repositories if needed)
    Task<User?> GetUserByEmailAsync(string email);
    Task<RefreshToken?> GetActiveRefreshTokenAsync(string token);
    Task<IEnumerable<Project>> GetUserProjectsAsync(int userId);
    Task<IEnumerable<AzureResource>> GetProjectResourcesAsync(int projectId);
    Task<IEnumerable<ResourceMetric>> GetResourceMetricsAsync(int resourceId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<UserAzureCredential?> GetUserDefaultCredentialAsync(int userId);
    Task<IEnumerable<ProjectConversation>> GetProjectConversationsAsync(int projectId, int? limit = null);
}