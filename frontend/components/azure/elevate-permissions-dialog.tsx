"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { azureService } from "@/lib/azure";
import {
  Loader2,
  Shield,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

interface ElevatePermissionsDialogProps {
  credentialId: number;
  credentialName: string;
  onPermissionsElevated: () => void;
  children: React.ReactNode;
}

export function ElevatePermissionsDialog({
  credentialId,
  credentialName,
  onPermissionsElevated,
  children,
}: ElevatePermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const handleValidateToken = async () => {
    if (!accessToken.trim()) {
      setError("Please enter an access token");
      return;
    }

    try {
      setValidating(true);
      setError("");
      const result = await azureService.validateAzureToken(accessToken.trim());
      setTokenValid(result.isValid);
      if (!result.isValid) {
        setError("Invalid or expired access token");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setError("Failed to validate token");
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleElevatePermissions = async () => {
    if (!accessToken.trim()) {
      setError("Please enter an access token");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const result = await azureService.elevateServicePrincipalPermissions(
        credentialId,
        accessToken.trim()
      );

      if (result.success) {
        setSuccess(result.message || "Permissions elevated successfully");
        onPermissionsElevated();
        // Auto close after a delay
        setTimeout(() => {
          setOpen(false);
          resetForm();
        }, 2000);
      } else {
        setError(result.errorMessage || "Failed to elevate permissions");
      }
    } catch (error: any) {
      console.error("Permission elevation error:", error);
      if (error.response?.status === 403) {
        setError(
          "You don't have permission to assign roles. You need Owner or User Access Administrator role on this subscription."
        );
      } else if (error.response?.status === 401) {
        setError("Authentication failed. Please check your access token.");
      } else {
        setError(
          error.response?.data?.message || "Failed to elevate permissions"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAccessToken("");
    setError("");
    setSuccess("");
    setTokenValid(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-azure-blue" />
            Elevate Service Principal Permissions
          </DialogTitle>
          <DialogDescription>
            Grant your service principal elevated permissions to assign roles
            and manage resources automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Information Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>What this does:</strong> Assigns User Access Administrator
              and Contributor roles to "{credentialName}", enabling it to manage
              resources and assign roles to itself for future operations.
            </AlertDescription>
          </Alert>

          {/* Prerequisites Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Prerequisites:</strong> You need Owner or User Access
              Administrator role on your subscription. If you don't have these
              permissions, you'll need to manually assign roles in the Azure
              portal.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="accessToken">
              Azure Resource Manager Access Token
            </Label>
            <div className="space-y-2">
              <Textarea
                id="accessToken"
                placeholder="Enter your Azure ARM access token..."
                value={accessToken}
                onChange={(e) => {
                  setAccessToken(e.target.value);
                  setTokenValid(null);
                  setError("");
                }}
                className="min-h-[100px] font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidateToken}
                  disabled={validating || !accessToken.trim()}
                >
                  {validating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validate Token
                    </>
                  )}
                </Button>
                {tokenValid !== null && (
                  <div
                    className={`flex items-center text-sm ${
                      tokenValid ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tokenValid ? (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Valid token
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-1 h-4 w-4" />
                        Invalid token
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* How to get token */}
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              <strong>How to get this token:</strong>
              <br />
              Run this command in Azure CLI:
              <code className="block mt-1 p-2 bg-muted rounded text-sm font-mono">
                az account get-access-token --resource
                https://management.azure.com/ --query accessToken --output tsv
              </code>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 text-green-800 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleElevatePermissions}
            disabled={loading || !accessToken.trim() || tokenValid === false}
            className="bg-azure-blue hover:bg-azure-blue/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Elevating Permissions...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Elevate Permissions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
