"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddCredentialsDialog } from "@/components/azure/add-credentials-dialog";
import { CreateServicePrincipalDialog } from "@/components/azure/create-service-principal-dialog";
import { AssignRoleDialog } from "@/components/azure/assign-role-dialog";
import { ElevatePermissionsDialog } from "@/components/azure/elevate-permissions-dialog";
import { azureService, AzureCredential } from "@/lib/azure";
import { useAuth } from "@/contexts/auth-context";
import {
  Settings,
  Plus,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Star,
  RefreshCw,
  Calendar,
  ExternalLink,
  Home,
  Shield,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<AzureCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [checkingRole, setCheckingRole] = useState<number | null>(null);
  const [roleResults, setRoleResults] = useState<
    Record<
      number,
      { hasContributorRole: boolean; message: string; isValid: boolean }
    >
  >({});

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await azureService.getCredentials();
      setCredentials(data);
    } catch (error) {
      console.error("Failed to load credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCredentials = async (credentialId: number) => {
    try {
      setValidating(credentialId);
      await azureService.validateCredentials(credentialId);
      await loadCredentials(); // Refresh to get updated validation status
    } catch (error) {
      console.error("Failed to validate credentials:", error);
    } finally {
      setValidating(null);
    }
  };

  const handleSetDefault = async (credentialId: number) => {
    try {
      await azureService.setDefaultCredential(credentialId);
      await loadCredentials();
    } catch (error) {
      console.error("Failed to set default credential:", error);
    }
  };

  const handleDeleteCredential = async (credentialId: number) => {
    try {
      setDeleting(credentialId);

      // First call to get confirmation details
      const confirmationResponse = await azureService.deleteCredential(
        credentialId,
        false
      );

      if (confirmationResponse.requiresConfirmation) {
        const confirmed = window.confirm(
          `${confirmationResponse.message}\n\n${
            confirmationResponse.warning || ""
          }`
        );

        if (confirmed) {
          await azureService.deleteCredential(credentialId, true);
          await loadCredentials();
        }
      }
    } catch (error) {
      console.error("Failed to delete credential:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleCheckSubscriptionRole = async (credentialId: number) => {
    try {
      setCheckingRole(credentialId);
      const result = await azureService.checkSubscriptionRole(credentialId);
      setRoleResults((prev) => ({
        ...prev,
        [credentialId]: {
          hasContributorRole: result.hasContributorRole,
          message: result.message,
          isValid: result.isValid,
        },
      }));
    } catch (error) {
      console.error("Failed to check subscription role:", error);
      setRoleResults((prev) => ({
        ...prev,
        [credentialId]: {
          hasContributorRole: false,
          message: "Failed to check role permissions",
          isValid: false,
        },
      }));
    } finally {
      setCheckingRole(null);
    }
  };

  const getStatusBadge = (credential: AzureCredential) => {
    const isRecentlyValidated =
      new Date(credential.lastValidated) >
      new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (credential.isActive && isRecentlyValidated) {
      return (
        <Badge className="status-running">
          <CheckCircle className="mr-1 h-3 w-3" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge className="status-warning">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Needs Validation
        </Badge>
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
        <Link
          href="/dashboard"
          className="hover:text-azure-blue flex items-center"
        >
          <Home className="mr-1 h-4 w-4" />
          Dashboard
        </Link>
        <span>/</span>
        <span>Settings</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3 h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and Azure subscriptions
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="text-sm">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm">{user?.email}</p>
            </div>
            {user?.company && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Company
                </label>
                <p className="text-sm">{user.company}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Member Since
              </label>
              <p className="text-sm">{formatDate(user?.createdAt || "")}</p>
            </div>
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Azure Subscriptions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Cloud className="mr-2 h-5 w-5 text-azure-blue" />
                  Azure Subscriptions
                </CardTitle>
                <CardDescription>
                  Manage your connected Azure subscriptions
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <AddCredentialsDialog onCredentialsAdded={loadCredentials}>
                  <Button variant="azure" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subscription
                  </Button>
                </AddCredentialsDialog>
                <CreateServicePrincipalDialog onCreated={loadCredentials}>
                  <Button variant="outline" size="sm">
                    <Shield className="mr-2 h-4 w-4" />
                    Create Service Principal
                  </Button>
                </CreateServicePrincipalDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-azure-blue" />
                <p className="text-muted-foreground">
                  Loading subscriptions...
                </p>
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-12">
                <Cloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Azure subscriptions
                </h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Azure subscription to start deploying resources
                </p>
                <AddCredentialsDialog onCredentialsAdded={loadCredentials}>
                  <Button variant="azure">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Subscription
                  </Button>
                </AddCredentialsDialog>
              </div>
            ) : (
              <div className="space-y-4">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold flex items-center">
                            {credential.displayName}
                            {credential.isDefault && (
                              <Star className="ml-2 h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </h4>
                          {getStatusBadge(credential)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Subscription:</span>{" "}
                            {credential.subscriptionName || "Loading..."}
                          </div>
                          <div>
                            <span className="font-medium">ID:</span>
                            <code className="ml-1 text-xs">
                              {credential.subscriptionId.substring(0, 8)}...
                            </code>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>
                              Added {formatDate(credential.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            <span>
                              Validated {formatDate(credential.lastValidated)}
                            </span>
                          </div>
                        </div>

                        {/* Role Check Results */}
                        {roleResults[credential.id] && (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${
                              roleResults[credential.id].hasContributorRole
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-yellow-50 border-yellow-200 text-yellow-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {roleResults[credential.id]
                                  .hasContributorRole ? (
                                  <Shield className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                )}
                                <span className="text-sm font-medium">
                                  {roleResults[credential.id].hasContributorRole
                                    ? "Contributor Role Confirmed"
                                    : "Missing Contributor Role"}
                                </span>
                              </div>
                              {!roleResults[credential.id]
                                .hasContributorRole && (
                                <div className="flex space-x-2">
                                  <AssignRoleDialog
                                    credentialId={credential.id}
                                    credentialName={credential.displayName}
                                    onRoleAssigned={loadCredentials}
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Assign Role
                                    </Button>
                                  </AssignRoleDialog>
                                  <ElevatePermissionsDialog
                                    credentialId={credential.id}
                                    credentialName={credential.displayName}
                                    onPermissionsElevated={loadCredentials}
                                  >
                                    <Button
                                      size="sm"
                                      variant="azure"
                                      className="text-xs"
                                    >
                                      Elevate Permissions
                                    </Button>
                                  </ElevatePermissionsDialog>
                                </div>
                              )}
                            </div>
                            <p className="text-xs mt-1">
                              {roleResults[credential.id].message}
                            </p>
                            {!roleResults[credential.id].hasContributorRole && (
                              <p className="text-xs mt-2 text-yellow-700">
                                ⚠️ Without Contributor role, resource
                                provisioning may fail
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleValidateCredentials(credential.id)
                          }
                          disabled={validating === credential.id}
                          title="Validate credentials"
                        >
                          {validating === credential.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCheckSubscriptionRole(credential.id)
                          }
                          disabled={checkingRole === credential.id}
                          title="Check Contributor role"
                        >
                          {checkingRole === credential.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>

                        <ElevatePermissionsDialog
                          credentialId={credential.id}
                          credentialName={credential.displayName}
                          onPermissionsElevated={loadCredentials}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            title="Elevate service principal permissions"
                            className="text-azure-blue hover:text-azure-blue"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </ElevatePermissionsDialog>

                        {!credential.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(credential.id)}
                            title="Set as default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCredential(credential.id)}
                          disabled={deleting === credential.id}
                          className="text-destructive hover:text-destructive"
                          title="Delete credentials"
                        >
                          {deleting === credential.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-6 p-4 bg-azure-gradient-subtle rounded-lg">
                  <div className="flex items-start space-x-3">
                    <ExternalLink className="h-5 w-5 text-azure-blue mt-0.5" />
                    <div>
                      <h4 className="font-medium text-azure-blue mb-1">
                        Need help with Azure setup?
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Learn how to create service principals, assign roles,
                        and elevate permissions in our documentation.
                      </p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>
                          • Use <strong>Elevate Permissions</strong> to
                          automatically assign User Access Administrator and
                          Contributor roles
                        </div>
                        <div>
                          • Requires Owner or User Access Administrator role on
                          your subscription
                        </div>
                        <div>
                          • Get Azure ARM tokens using:{" "}
                          <code className="text-xs bg-muted px-1 rounded">
                            az account get-access-token --resource
                            https://management.azure.com/
                          </code>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 p-0 h-auto text-azure-blue hover:text-azure-blue"
                      >
                        View Documentation →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
