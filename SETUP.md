# Easel Setup Guide

This guide will help you set up the Easel AI-powered Azure resource management application.

## Prerequisites

- .NET 9 SDK
- Node.js 18+ and npm
- SQL Server LocalDB (or full SQL Server)
- OpenAI API key
- Azure subscription and service principal credentials

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create your development configuration:**
   ```bash
   cp appsettings.Example.json appsettings.Development.json
   ```

3. **Configure your settings in `appsettings.Development.json`:**
   - Replace `REPLACE-WITH-YOUR-SECRET-KEY-MINIMUM-32-CHARACTERS` with a secure 32+ character JWT secret
   - Replace `REPLACE-WITH-YOUR-OPENAI-API-KEY` with your OpenAI API key
   - Update the connection string if needed

4. **Install dependencies:**
   ```bash
   dotnet restore
   ```

5. **Run database migrations:**
   ```bash
   dotnet ef database update
   ```

6. **Start the backend:**
   ```bash
   dotnet run
   ```

## Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Create your environment file:**
   ```bash
   cp .env.example .env.local
   ```

3. **Update `.env.local` with your backend URL** (default should work for local development)

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start the frontend:**
   ```bash
   npm run dev
   ```

## Azure Configuration

To use Azure resource provisioning, you'll need to:

1. Create an Azure service principal:
   ```bash
   az ad sp create-for-rbac --name "easel-service-principal" --role Contributor --scopes /subscriptions/YOUR-SUBSCRIPTION-ID
   ```

2. Save the returned credentials securely - you'll enter these in the Easel settings page.

## Security Notes

⚠️ **IMPORTANT**: Never commit the following files to git:
- `backend/appsettings.Development.json`
- `backend/appsettings.Production.json`
- `frontend/.env.local`
- `frontend/.env.production.local`

These files are automatically ignored by `.gitignore` but always double-check before committing.

## Default URLs

- Backend API: https://localhost:7001
- Frontend App: http://localhost:3000
- Swagger UI: https://localhost:7001/swagger

## Troubleshooting

### Database Issues
- Ensure SQL Server LocalDB is installed and running
- Check connection string in `appsettings.Development.json`
- Try running `dotnet ef database drop` and `dotnet ef database update` to reset

### CORS Issues
- Ensure frontend URL is listed in `Cors.AllowedOrigins` in backend config
- Check that both backend and frontend are running on expected ports

### Authentication Issues
- Verify JWT secret key is at least 32 characters
- Check that clock sync is correct between client and server