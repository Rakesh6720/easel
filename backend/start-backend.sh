#!/bin/bash
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://localhost:5001
echo "Starting Easel backend..."
/mnt/c/Program\ Files/dotnet/dotnet.exe bin/Debug/net9.0/backend.dll