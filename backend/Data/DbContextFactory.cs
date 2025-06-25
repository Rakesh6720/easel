using Microsoft.EntityFrameworkCore;

namespace backend.Data;

/// <summary>
/// Database context factory for creating EaselDbContext with different database providers
/// </summary>
public class DbContextFactory
{
    /// <summary>
    /// Creates EaselDbContext with SQLite provider
    /// </summary>
    public static EaselDbContext CreateSqliteContext(string connectionString)
    {
        var optionsBuilder = new DbContextOptionsBuilder<EaselDbContext>();
        optionsBuilder.UseSqlite(connectionString, options =>
        {
            options.CommandTimeout(30);
        });
        
        // Enable sensitive data logging in development
        optionsBuilder.EnableSensitiveDataLogging();
        optionsBuilder.EnableDetailedErrors();
        
        return new EaselDbContext(optionsBuilder.Options);
    }

    /// <summary>
    /// Creates EaselDbContext with SQL Server provider
    /// </summary>
    public static EaselDbContext CreateSqlServerContext(string connectionString)
    {
        var optionsBuilder = new DbContextOptionsBuilder<EaselDbContext>();
        optionsBuilder.UseSqlServer(connectionString, options =>
        {
            options.CommandTimeout(30);
            options.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorNumbersToAdd: null);
        });
        
        // Enable sensitive data logging in development
        optionsBuilder.EnableSensitiveDataLogging();
        optionsBuilder.EnableDetailedErrors();
        
        return new EaselDbContext(optionsBuilder.Options);
    }

    /// <summary>
    /// Creates EaselDbContext with in-memory provider (for testing)
    /// </summary>
    public static EaselDbContext CreateInMemoryContext(string databaseName = "TestDb")
    {
        var optionsBuilder = new DbContextOptionsBuilder<EaselDbContext>();
        optionsBuilder.UseInMemoryDatabase(databaseName);
        
        return new EaselDbContext(optionsBuilder.Options);
    }
}