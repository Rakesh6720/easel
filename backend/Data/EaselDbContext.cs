using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class EaselDbContext : DbContext
{
    public EaselDbContext(DbContextOptions<EaselDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<AzureResource> AzureResources { get; set; }
    public DbSet<ResourceMetric> ResourceMetrics { get; set; }
    public DbSet<ProjectConversation> ProjectConversations { get; set; }
    public DbSet<UserAzureCredential> UserAzureCredentials { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // User configuration
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
            
        modelBuilder.Entity<User>()
            .HasMany(u => u.Projects)
            .WithOne(p => p.User)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<User>()
            .HasMany(u => u.AzureCredentials)
            .WithOne(c => c.User)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Project configuration
        modelBuilder.Entity<Project>()
            .HasMany(p => p.Resources)
            .WithOne(r => r.Project)
            .HasForeignKey(r => r.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<Project>()
            .HasMany(p => p.Conversations)
            .WithOne(c => c.Project)
            .HasForeignKey(c => c.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // AzureResource configuration
        modelBuilder.Entity<AzureResource>()
            .HasMany(r => r.Metrics)
            .WithOne(m => m.AzureResource)
            .HasForeignKey(m => m.AzureResourceId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<AzureResource>()
            .Property(r => r.EstimatedMonthlyCost)
            .HasColumnType("decimal(18,2)");
        
        // UserAzureCredential configuration
        modelBuilder.Entity<UserAzureCredential>()
            .HasMany(c => c.Projects)
            .WithOne(p => p.UserAzureCredential)
            .HasForeignKey(p => p.UserAzureCredentialId)
            .OnDelete(DeleteBehavior.SetNull);
        
        // Indexes for performance
        modelBuilder.Entity<ResourceMetric>()
            .HasIndex(m => new { m.AzureResourceId, m.Timestamp });
        
        modelBuilder.Entity<Project>()
            .HasIndex(p => p.Status);
            
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.Token);
    }
}