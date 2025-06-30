# Service Principal Permission Elevation Guide

## Overview

When you create a service principal through Easel, it initially has minimal permissions in your Azure subscription. To enable full functionality (like automatic resource provisioning), you may need to elevate the service principal's permissions.

## Why Permission Elevation is Needed

Service principals are created with minimal permissions for security reasons. To perform certain operations like:

- Creating and managing Azure resources
- Assigning roles to other service principals
- Managing resource groups

Your service principal needs elevated permissions.

## Automatic Elevation (Recommended)

Easel can attempt to automatically elevate your service principal permissions if you have the necessary user permissions.

### Prerequisites

You need one of the following roles on your subscription:

- **Owner** (recommended)
- **User Access Administrator**
- **Contributor** + **User Access Administrator**

### How to Elevate Automatically

1. Go to **Settings** → **Azure Credentials**
2. Find your service principal
3. Click **"Elevate Permissions"** button
4. Provide a valid Azure access token when prompted
5. Easel will assign the **User Access Administrator** role to your service principal

### What Happens During Elevation

1. **User Access Administrator Role**: This allows the service principal to assign other roles
2. **Contributor Role**: This allows the service principal to manage resources
3. The service principal can now self-manage its permissions for future operations

## Manual Elevation (Alternative)

If automatic elevation fails, you can manually assign roles in the Azure portal:

### Step 1: Navigate to Azure Portal

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to **Subscriptions**
3. Select your subscription
4. Go to **Access control (IAM)**

### Step 2: Add Role Assignment

1. Click **"Add"** → **"Add role assignment"**
2. Select **"User Access Administrator"** role
3. Click **"Next"**
4. Select **"User, group, or service principal"**
5. Search for your service principal by name
6. Select it and click **"Review + assign"**

### Step 3: Add Contributor Role (Optional)

1. Repeat the process above
2. But select **"Contributor"** role instead
3. Assign it to the same service principal

## Required Azure Access Tokens

For automatic elevation, you need an Azure Resource Manager token:

```bash
# Get ARM token (for role assignments)
az account get-access-token --resource https://management.azure.com/ --query accessToken --output tsv
```

**Note**: This is different from the Microsoft Graph token used for service principal creation.

## Token Types Summary

| Operation                | Required Token         | Command                                                                |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------- |
| Create Service Principal | Microsoft Graph        | `az account get-access-token --resource https://graph.microsoft.com/`  |
| Elevate Permissions      | Azure Resource Manager | `az account get-access-token --resource https://management.azure.com/` |
| Assign Contributor Role  | Azure Resource Manager | `az account get-access-token --resource https://management.azure.com/` |

## Troubleshooting

### "AuthorizationFailed" Error

- You don't have sufficient permissions on the subscription
- Contact your subscription administrator to grant you **Owner** or **User Access Administrator** role

### "Invalid Token" Error

- The access token has expired (tokens expire after 1 hour)
- Get a fresh token using the Azure CLI commands above
- Make sure you're using the correct token type (Graph vs ARM)

### "Service Principal Not Found" Error

- The service principal may have been deleted
- Recreate the service principal through Easel

## Best Practices

1. **Use automatic elevation when possible** - it's faster and reduces manual errors
2. **Keep tokens secure** - don't share or store access tokens
3. **Use minimum required permissions** - only assign roles that are actually needed
4. **Regular auditing** - periodically review service principal permissions
5. **Document purposes** - use clear display names that indicate the service principal's purpose

## Security Considerations

- **User Access Administrator** role is powerful - it can assign any role to any principal
- **Contributor** role can manage most Azure resources but cannot assign roles
- **Owner** role has full control including role assignments
- Consider using **Custom Roles** for more granular permissions if needed

## FAQ

**Q: Why can't the service principal assign roles to itself initially?**
A: This is Azure's security model - service principals start with minimal permissions to prevent privilege escalation attacks.

**Q: What's the difference between Owner and User Access Administrator?**
A: Owner has full control including resource management and role assignments. User Access Administrator can only manage role assignments but not resources.

**Q: Can I revoke these permissions later?**
A: Yes, you can remove role assignments through the Azure portal or Azure CLI at any time.

**Q: Will this affect my Azure bill?**
A: No, role assignments don't incur additional costs. Only the actual resources you create will be billed.
