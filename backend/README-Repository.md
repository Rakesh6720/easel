# Repository Pattern Implementation

This document explains how to use the IRepository interface pattern implemented in the Easel backend for seamless database switching between SQL Server and SQLite.

## Overview

The repository pattern provides a consistent interface for data access operations while allowing you to switch between different database providers without changing your business logic code.

## Architecture

### Components

1. **IRepository<T>** - Generic repository interface
2. **BaseRepository<T>** - Base implementation with common CRUD operations
3. **IUnitOfWork** - Manages repository instances and transactions
4. **UnitOfWork** - Implementation of the Unit of Work pattern
5. **DatabaseConfiguration** - Extension methods for database setup

### Database Providers Supported

- **SQLite** - Lightweight, file-based database (default for development)
- **SQL Server** - Full-featured SQL Server (LocalDB or full instance)
- **In-Memory** - For testing scenarios

## Configuration

### appsettings.json Structure

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=easel.db",
    "SqliteConnection": "Data Source=easel.db",
    "SqlServerConnection": "Server=(localdb)\\mssqllocaldb;Database=EaselDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Database": {
    "Provider": "SQLite",
    "AutoMigrate": true,
    "SeedData": false,
    "CommandTimeout": 30,
    "EnableSensitiveDataLogging": false,
    "EnableDetailedErrors": false
  }
}
```

### Database Provider Options

- `Provider`: "SQLite", "SqlServer", or "InMemory"
- `AutoMigrate`: Automatically run migrations on startup
- `SeedData`: Seed initial data on startup
- `CommandTimeout`: Database command timeout in seconds
- `EnableSensitiveDataLogging`: Enable for debugging (development only)
- `EnableDetailedErrors`: Show detailed EF errors (development only)

## Usage Examples

### Using the Unit of Work Pattern

```csharp
public class ProjectsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public ProjectsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        var projects = await _unitOfWork.Projects.GetAllAsync();
        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(int id)
    {
        var project = await _unitOfWork.Projects.GetByIdWithIncludesAsync(id, 
            p => p.Resources, 
            p => p.Conversations);
        
        if (project == null)
            return NotFound();
            
        return Ok(project);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject(Project project)
    {
        await _unitOfWork.Projects.AddAsync(project);
        await _unitOfWork.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, Project project)
    {
        var existingProject = await _unitOfWork.Projects.GetByIdAsync(id);
        if (existingProject == null)
            return NotFound();

        // Update properties
        existingProject.Name = project.Name;
        existingProject.Description = project.Description;
        existingProject.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Projects.UpdateAsync(existingProject);
        await _unitOfWork.SaveChangesAsync();
        
        return NoContent();
    }
}
```

### Using Specialized Queries

```csharp
public class UserService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<User?> GetUserWithProjectsAsync(string email)
    {
        return await _unitOfWork.GetUserByEmailAsync(email);
    }

    public async Task<IEnumerable<Project>> GetUserProjectsAsync(int userId)
    {
        return await _unitOfWork.GetUserProjectsAsync(userId);
    }

    public async Task<UserAzureCredential?> GetUserDefaultCredentialAsync(int userId)
    {
        return await _unitOfWork.GetUserDefaultCredentialAsync(userId);
    }
}
```

### Using Transactions

```csharp
public async Task<IActionResult> CreateProjectWithResources(CreateProjectRequest request)
{
    try
    {
        await _unitOfWork.BeginTransactionAsync();

        // Create project
        var project = new Project { /* ... */ };
        await _unitOfWork.Projects.AddAsync(project);
        await _unitOfWork.SaveChangesAsync();

        // Create resources
        foreach (var resourceData in request.Resources)
        {
            var resource = new AzureResource 
            { 
                ProjectId = project.Id,
                /* ... */
            };
            await _unitOfWork.AzureResources.AddAsync(resource);
        }

        await _unitOfWork.SaveChangesAsync();
        await _unitOfWork.CommitTransactionAsync();

        return Ok(project);
    }
    catch
    {
        await _unitOfWork.RollbackTransactionAsync();
        throw;
    }
}
```

## Switching Between Database Providers

### Method 1: Using the Script

```bash
# Switch to SQLite (default)
./Scripts/switch-database.sh sqlite

# Switch to SQL Server
./Scripts/switch-database.sh sqlserver

# Switch to In-Memory (for testing)
./Scripts/switch-database.sh testing
```

### Method 2: Environment Variables

```bash
# Set environment-specific configuration
export ASPNETCORE_ENVIRONMENT=SqlServer
dotnet run

# Or for testing
export ASPNETCORE_ENVIRONMENT=Testing
dotnet test
```

### Method 3: Manual Configuration

Update the `Database.Provider` setting in your appsettings file:

```json
{
  "Database": {
    "Provider": "SqlServer"  // Change to "SQLite" or "InMemory"
  }
}
```

## Entity Framework Migrations

### Creating Migrations

```bash
# For SQLite
dotnet ef migrations add MigrationName --context EaselDbContext

# For SQL Server (set environment first)
export ASPNETCORE_ENVIRONMENT=SqlServer
dotnet ef migrations add MigrationName --context EaselDbContext
```

### Applying Migrations

```bash
# Automatic (via configuration)
# Set "AutoMigrate": true in appsettings

# Manual
dotnet ef database update

# Or programmatically
await app.Services.EnsureDatabaseAsync();
```

## Testing

The repository pattern makes unit testing easier by allowing you to mock the repositories:

```csharp
[Test]
public async Task GetProject_ReturnsProject_WhenExists()
{
    // Arrange
    var mockUnitOfWork = new Mock<IUnitOfWork>();
    var expectedProject = new Project { Id = 1, Name = "Test Project" };
    
    mockUnitOfWork.Setup(x => x.Projects.GetByIdAsync(1))
              .ReturnsAsync(expectedProject);

    var controller = new ProjectsController(mockUnitOfWork.Object);

    // Act
    var result = await controller.GetProject(1);

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result);
    var project = Assert.IsType<Project>(okResult.Value);
    Assert.Equal(expectedProject.Name, project.Name);
}
```

## Best Practices

1. **Always use the Unit of Work**: Don't inject individual repositories
2. **Handle transactions properly**: Use try/catch with rollback
3. **Use includes wisely**: Only include related data you actually need
4. **Prefer async methods**: All repository methods are async
5. **Configure appropriately**: Use different settings for dev/test/prod
6. **Test with multiple providers**: Ensure your code works with both SQLite and SQL Server

## Troubleshooting

### Common Issues

1. **Migration errors**: Ensure the correct environment is set
2. **Connection string issues**: Verify the connection string format for your provider
3. **LocalDB not found**: Install SQL Server LocalDB for SQL Server testing
4. **File permissions**: Ensure write permissions for SQLite database files

### Debugging

Enable detailed logging in appsettings.Development.json:

```json
{
  "Database": {
    "EnableSensitiveDataLogging": true,
    "EnableDetailedErrors": true
  },
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```