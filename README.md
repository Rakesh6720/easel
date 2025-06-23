# Easel

AI-powered Azure resource provisioning and management platform.

## Architecture

- **Backend**: .NET 9 Web API with C#
- **Frontend**: Next.js with TypeScript and React
- **AI Integration**: OpenAI API for natural language processing
- **Azure Integration**: Azure SDK for .NET for resource management
- **Database**: Entity Framework Core with SQL Server

## Project Structure

```
easel/
├── backend/           # .NET 9 Web API
├── frontend/          # Next.js application
├── shared/            # Shared types and utilities
└── docker-compose.yml # Development environment
```

## Getting Started

### Prerequisites
- .NET 9 SDK
- Node.js 18+
- Azure CLI
- Docker (optional)

### Development
```bash
# Start backend
cd backend
dotnet run

# Start frontend
cd frontend
npm run dev
```