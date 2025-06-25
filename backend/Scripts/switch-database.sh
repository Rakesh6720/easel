#!/bin/bash

# Script to easily switch between database providers
# Usage: ./switch-database.sh [sqlite|sqlserver|testing]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Default to SQLite if no argument provided
PROVIDER=${1:-sqlite}

case $PROVIDER in
    sqlite)
        echo "Switching to SQLite database..."
        export ASPNETCORE_ENVIRONMENT="Development"
        
        # Update appsettings.Development.json to use SQLite
        cat > "$BACKEND_DIR/appsettings.Development.json" <<EOF
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=easel.db",
    "SqliteConnection": "Data Source=easel.db",
    "SqlServerConnection": "Server=(localdb)\\\\mssqllocaldb;Database=EaselDb_Dev;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Database": {
    "Provider": "SQLite",
    "AutoMigrate": true,
    "SeedData": true,
    "CommandTimeout": 30,
    "EnableSensitiveDataLogging": true,
    "EnableDetailedErrors": true
  },
  "JwtSettings": {
    "SecretKey": "this-is-a-very-secure-jwt-secret-key-for-development-only-32-characters-minimum",
    "Issuer": "Easel",
    "Audience": "EaselUsers",
    "ExpiryInMinutes": 60,
    "RefreshTokenExpiryInDays": 7
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001", "https://localhost:3001"]
  }
}
EOF
        echo "✓ Configured for SQLite database"
        ;;
        
    sqlserver)
        echo "Switching to SQL Server database..."
        export ASPNETCORE_ENVIRONMENT="SqlServer"
        
        echo "✓ Configured for SQL Server database"
        echo "Note: Make sure SQL Server LocalDB is installed and running"
        echo "Run: sqllocaldb start mssqllocaldb"
        ;;
        
    testing)
        echo "Switching to In-Memory database for testing..."
        export ASPNETCORE_ENVIRONMENT="Testing"
        
        echo "✓ Configured for In-Memory database (testing)"
        ;;
        
    *)
        echo "Error: Unknown database provider '$PROVIDER'"
        echo "Usage: $0 [sqlite|sqlserver|testing]"
        exit 1
        ;;
esac

echo ""
echo "Database provider switched to: $PROVIDER"
echo "Environment: $ASPNETCORE_ENVIRONMENT"
echo ""
echo "To apply the changes:"
echo "1. Stop the backend if it's running"
echo "2. Run: dotnet ef database update (if using Entity Framework migrations)"
echo "3. Restart the backend"
echo ""

# Optionally run migrations if dotnet ef is available
if command -v dotnet-ef &> /dev/null; then
    read -p "Would you like to run database migrations now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$BACKEND_DIR"
        echo "Running database migrations..."
        dotnet ef database update
        echo "✓ Database migrations completed"
    fi
fi