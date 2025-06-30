# Service Principal Creation Feature

## Overview

The Easel app now allows users to create Azure service principals with Contributor role directly from the application interface. This eliminates the need for manual Azure Portal configuration and streamlines the Azure credentials setup process.

## Implementation Details

### Backend Components

#### 1. Service Principal Service (`ServicePrincipalService.cs`)

- **Purpose**: Handles service principal creation using Microsoft Graph SDK v5
- **Key Features**:
  - Creates Azure application registration
  - Creates service principal from the application
  - Generates client secret with 2-year expiration
  - Assigns Contributor role to the subscription
  - Automatically saves credentials to user's Easel account
  - Validates user's Azure access token

#### 2. Controller Endpoints (`AzureController.cs`)

- `POST /api/azure/service-principal/create` - Creates a new service principal
- `POST /api/azure/token/validate` - Validates Azure access token

#### 3. Data Models

- `CreateServicePrincipalRequest` - Input model for service principal creation
- `ServicePrincipalCreationResult` - Response model with creation results
- `IServicePrincipalService` - Service interface

### Frontend Components

#### 1. Service Principal Creation Dialog (`create-service-principal-dialog.tsx`)

- **Purpose**: Multi-step wizard for service principal creation
- **Steps**:
  1. **Form Step**: Collect service principal name and subscription ID
  2. **Azure Auth Step**: Guide user to obtain Azure access token
  3. **Creating Step**: Show progress while creating service principal
  4. **Result Step**: Display created credentials with copy functionality

#### 2. Azure Authentication Guide (`azure-auth-guide.tsx`)

- **Purpose**: Comprehensive guide for obtaining Azure access tokens
- **Methods Supported**:
  - Azure CLI (recommended for security)
  - Browser console (for testing)
- **Features**:
  - Step-by-step instructions
  - Copy-to-clipboard functionality
  - Security warnings and best practices

#### 3. Settings Page Integration

- Added "Create Service Principal" button next to "Add Subscription"
- Integrated with existing credential management workflow

### Azure SDK Dependencies

#### Backend NuGet Packages

```xml
<PackageReference Include="Microsoft.Graph" Version="5.77.0" />
<PackageReference Include="Azure.ResourceManager.Authorization" Version="1.1.3" />
<PackageReference Include="Azure.Identity" Version="1.12.0" />
<PackageReference Include="Azure.ResourceManager" Version="1.13.0" />
```

## Security Features

### 1. Token Validation

- Validates Azure access tokens before using them
- Uses Microsoft Graph to verify token authenticity
- Extracts tenant ID from JWT token payload

### 2. Access Control

- Requires valid Easel authentication (JWT bearer token)
- Uses user's own Azure permissions for service principal creation
- No elevation of privileges

### 3. Secure Credential Storage

- Client secrets are stored in the database (TODO: implement encryption)
- Automatic credential saving prevents manual handling
- 2-year expiration on generated secrets

## User Workflow

### 1. Access the Feature

1. Navigate to Settings page
2. Click "Create Service Principal" button

### 2. Configure Service Principal

1. Enter service principal name (e.g., "Easel-MyProject-SP")
2. Enter Azure subscription ID
3. Choose whether to auto-assign Contributor role

### 3. Provide Azure Authentication

1. Obtain Azure access token using:
   - Azure CLI: `az account get-access-token --query accessToken --output tsv`
   - Browser console (for testing only)
2. Paste token into the dialog

### 4. Review Results

1. View created credentials (Client ID, Client Secret, Tenant ID)
2. Copy credentials to clipboard if needed
3. Credentials are automatically saved to Easel account

## Error Handling

### Backend Error Scenarios

- Invalid Azure access token
- Insufficient permissions for service principal creation
- Role assignment failures (non-blocking with warnings)
- Microsoft Graph API errors

### Frontend Error Handling

- Form validation for required fields
- Token validation before creation
- Clear error messages with actionable guidance
- Graceful degradation for role assignment failures

## Testing Support

### Mock Data

- Test users receive mock service principal creation responses
- Simulates successful creation with realistic data
- No actual Azure API calls for test users

## Future Enhancements

### Security Improvements

1. **Client Secret Encryption**: Implement encryption for stored client secrets
2. **Token Scope Validation**: Validate specific token scopes required
3. **Audit Logging**: Log service principal creation events

### User Experience

1. **Subscription Auto-Detection**: Pre-populate subscription list from user's Azure access
2. **Role Assignment Options**: Allow selection of different roles beyond Contributor
3. **Bulk Creation**: Support creating multiple service principals

### Integration Features

1. **Project Association**: Link service principals to specific Easel projects
2. **Automatic Cleanup**: Remove unused service principals
3. **Permission Monitoring**: Track and alert on permission changes

## API Reference

### Create Service Principal

```http
POST /api/azure/service-principal/create
Authorization: Bearer <easel-jwt-token>
Content-Type: application/json

{
  "subscriptionId": "00000000-0000-0000-0000-000000000000",
  "displayName": "Easel-MyProject-SP",
  "accessToken": "<azure-access-token>",
  "autoAssignContributorRole": true
}
```

### Validate Azure Token

```http
POST /api/azure/token/validate
Authorization: Bearer <easel-jwt-token>
Content-Type: application/json

{
  "accessToken": "<azure-access-token>"
}
```

## Troubleshooting

### Common Issues

#### 1. "Invalid Azure access token"

- **Cause**: Token expired or malformed
- **Solution**: Obtain a fresh token using Azure CLI or browser console

#### 2. "Insufficient permissions"

- **Cause**: User doesn't have permission to create service principals in Azure AD
- **Solution**: Contact Azure AD administrator for Application Developer role

#### 3. "Role assignment failed"

- **Cause**: User doesn't have permission to assign roles at subscription level
- **Solution**: Manually assign Contributor role in Azure Portal after creation

#### 4. "Failed to create application"

- **Cause**: Microsoft Graph API errors or network issues
- **Solution**: Check Azure service status and retry

### Debug Information

- All operations are logged with correlation IDs
- Error messages include actionable guidance
- Warnings are displayed for partial failures (e.g., role assignment issues)
