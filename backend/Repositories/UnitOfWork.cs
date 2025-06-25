using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using backend.Data;
using backend.Models;

namespace backend.Repositories;

/// <summary>
/// Unit of Work implementation for managing repositories and transactions
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly EaselDbContext _context;
    private IDbContextTransaction? _transaction;
    
    // Repository instances
    private IRepository<User>? _users;
    private IRepository<RefreshToken>? _refreshTokens;
    private IRepository<Project>? _projects;
    private IRepository<AzureResource>? _azureResources;
    private IRepository<ResourceMetric>? _resourceMetrics;
    private IRepository<ProjectConversation>? _projectConversations;
    private IRepository<UserAzureCredential>? _userAzureCredentials;

    public UnitOfWork(EaselDbContext context)
    {
        _context = context;
    }

    // Lazy-loaded repository properties
    public IRepository<User> Users => _users ??= new BaseRepository<User>(_context);
    public IRepository<RefreshToken> RefreshTokens => _refreshTokens ??= new BaseRepository<RefreshToken>(_context);
    public IRepository<Project> Projects => _projects ??= new BaseRepository<Project>(_context);
    public IRepository<AzureResource> AzureResources => _azureResources ??= new BaseRepository<AzureResource>(_context);
    public IRepository<ResourceMetric> ResourceMetrics => _resourceMetrics ??= new BaseRepository<ResourceMetric>(_context);
    public IRepository<ProjectConversation> ProjectConversations => _projectConversations ??= new BaseRepository<ProjectConversation>(_context);
    public IRepository<UserAzureCredential> UserAzureCredentials => _userAzureCredentials ??= new BaseRepository<UserAzureCredential>(_context);

    // Transaction management
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    // Specialized queries
    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .Include(u => u.Projects)
            .Include(u => u.AzureCredentials)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<RefreshToken?> GetActiveRefreshTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token && rt.IsActive);
    }

    public async Task<IEnumerable<Project>> GetUserProjectsAsync(int userId)
    {
        return await _context.Projects
            .Include(p => p.Resources)
            .Include(p => p.UserAzureCredential)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<AzureResource>> GetProjectResourcesAsync(int projectId)
    {
        return await _context.AzureResources
            .Include(r => r.Metrics)
            .Where(r => r.ProjectId == projectId)
            .OrderBy(r => r.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<ResourceMetric>> GetResourceMetricsAsync(int resourceId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.ResourceMetrics
            .Where(m => m.AzureResourceId == resourceId);

        if (fromDate.HasValue)
            query = query.Where(m => m.Timestamp >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(m => m.Timestamp <= toDate.Value);

        return await query
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<UserAzureCredential?> GetUserDefaultCredentialAsync(int userId)
    {
        return await _context.UserAzureCredentials
            .FirstOrDefaultAsync(c => c.UserId == userId && c.IsDefault && c.IsActive);
    }

    public async Task<IEnumerable<ProjectConversation>> GetProjectConversationsAsync(int projectId, int? limit = null)
    {
        var query = _context.ProjectConversations
            .Where(c => c.ProjectId == projectId)
            .OrderByDescending(c => c.CreatedAt);

        if (limit.HasValue)
            query = query.Take(limit.Value);

        return await query.ToListAsync();
    }

    // Dispose pattern
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}