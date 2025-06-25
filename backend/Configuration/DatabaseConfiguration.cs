using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Configuration;

/// <summary>
/// Database configuration options
/// </summary>
public class DatabaseOptions
{
    public const string SectionName = "Database";
    
    /// <summary>
    /// Database provider: "SQLite", "SqlServer", "InMemory"
    /// </summary>
    public string Provider { get; set; } = "SQLite";
    
    /// <summary>
    /// Connection string for the selected provider
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;
    
    /// <summary>
    /// SQL Server specific connection string (when Provider = "SqlServer")
    /// </summary>
    public string SqlServerConnectionString { get; set; } = string.Empty;
    
    /// <summary>
    /// SQLite specific connection string (when Provider = "SQLite")
    /// </summary>
    public string SqliteConnectionString { get; set; } = string.Empty;
    
    /// <summary>
    /// Whether to automatically migrate database on startup
    /// </summary>
    public bool AutoMigrate { get; set; } = true;
    
    /// <summary>
    /// Whether to seed initial data
    /// </summary>
    public bool SeedData { get; set; } = false;
    
    /// <summary>
    /// Command timeout in seconds
    /// </summary>
    public int CommandTimeout { get; set; } = 30;
    
    /// <summary>
    /// Whether to enable sensitive data logging (development only)
    /// </summary>
    public bool EnableSensitiveDataLogging { get; set; } = false;
    
    /// <summary>
    /// Whether to enable detailed errors (development only)
    /// </summary>
    public bool EnableDetailedErrors { get; set; } = false;
}

/// <summary>
/// Extension methods for configuring database services
/// </summary>
public static class DatabaseConfigurationExtensions
{
    /// <summary>
    /// Adds database context based on configuration
    /// </summary>
    public static IServiceCollection AddDatabaseContext(this IServiceCollection services, IConfiguration configuration)
    {
        var databaseOptions = configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>() 
                             ?? new DatabaseOptions();
        
        // Register the options
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.SectionName));
        
        // Determine connection string based on provider
        string connectionString = GetConnectionString(databaseOptions, configuration);
        
        // Add DbContext based on provider
        services.AddDbContext<EaselDbContext>(options =>
        {
            ConfigureDbContext(options, databaseOptions, connectionString);
        });
        
        return services;
    }
    
    private static string GetConnectionString(DatabaseOptions databaseOptions, IConfiguration configuration)
    {
        return databaseOptions.Provider.ToUpperInvariant() switch
        {
            "SQLSERVER" => !string.IsNullOrEmpty(databaseOptions.SqlServerConnectionString) 
                          ? databaseOptions.SqlServerConnectionString 
                          : configuration.GetConnectionString("SqlServerConnection") ?? databaseOptions.ConnectionString,
            "SQLITE" => !string.IsNullOrEmpty(databaseOptions.SqliteConnectionString) 
                       ? databaseOptions.SqliteConnectionString 
                       : configuration.GetConnectionString("SqliteConnection") ?? configuration.GetConnectionString("DefaultConnection") ?? databaseOptions.ConnectionString,
            "INMEMORY" => "InMemoryDb",
            _ => configuration.GetConnectionString("DefaultConnection") ?? databaseOptions.ConnectionString
        };
    }
    
    private static void ConfigureDbContext(DbContextOptionsBuilder options, DatabaseOptions databaseOptions, string connectionString)
    {
        switch (databaseOptions.Provider.ToUpperInvariant())
        {
            case "SQLSERVER":
                options.UseSqlServer(connectionString, sqlOptions =>
                {
                    sqlOptions.CommandTimeout(databaseOptions.CommandTimeout);
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorNumbersToAdd: null);
                });
                break;
                
            case "SQLITE":
                options.UseSqlite(connectionString, sqliteOptions =>
                {
                    sqliteOptions.CommandTimeout(databaseOptions.CommandTimeout);
                });
                break;
                
            case "INMEMORY":
                options.UseInMemoryDatabase(connectionString);
                break;
                
            default:
                throw new InvalidOperationException($"Unsupported database provider: {databaseOptions.Provider}");
        }
        
        // Development-specific configurations
        if (databaseOptions.EnableSensitiveDataLogging)
            options.EnableSensitiveDataLogging();
            
        if (databaseOptions.EnableDetailedErrors)
            options.EnableDetailedErrors();
    }
    
    /// <summary>
    /// Ensures database is created and optionally migrated
    /// </summary>
    public static async Task EnsureDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<EaselDbContext>();
        var databaseOptions = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<DatabaseOptions>>().Value;
        
        if (databaseOptions.AutoMigrate)
        {
            if (databaseOptions.Provider.ToUpperInvariant() == "INMEMORY")
            {
                await context.Database.EnsureCreatedAsync();
            }
            else
            {
                await context.Database.MigrateAsync();
            }
        }
        
        if (databaseOptions.SeedData)
        {
            await SeedDatabaseAsync(context);
        }
    }
    
    private static async Task SeedDatabaseAsync(EaselDbContext context)
    {
        // Add any initial seed data here
        // Example:
        if (!context.Users.Any())
        {
            // Add default admin user or test data
            // This is just a placeholder - implement according to your needs
        }
        
        await context.SaveChangesAsync();
    }
}