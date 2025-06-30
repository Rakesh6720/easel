"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  azureService,
  CreateServicePrincipalRequest,
  ServicePrincipalCreationResult,
} from "@/lib/azure";
import { AzureAuthGuide } from "./azure-auth-guide";
import {
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Shield,
  Key,
  Cloud,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateServicePrincipalDialogProps {
  onCreated?: (result: ServicePrincipalCreationResult) => void;
  children?: React.ReactNode;
}

export function CreateServicePrincipalDialog({
  onCreated,
  children,
}: CreateServicePrincipalDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    "form" | "azure-auth" | "creating" | "result"
  >("form");
  const [formData, setFormData] = useState({
    subscriptionId: "",
    displayName: "",
    autoAssignContributorRole: true,
  });
  const [azureToken, setAzureToken] = useState("");
  const [result, setResult] = useState<ServicePrincipalCreationResult | null>(
    null
  );
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subscriptionId || !formData.displayName) {
      setError("Please fill in all required fields");
      return;
    }
    setError(null);
    setStep("azure-auth");
  };

  const handleAzureAuth = async () => {
    if (!azureToken) {
      setError("Please provide your Azure access token");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate token first
      const tokenValidation = await azureService.validateAzureToken(azureToken);
      if (!tokenValidation.isValid) {
        setError(
          "Invalid Azure access token. Please sign in to Azure and try again."
        );
        return;
      }

      setStep("creating");

      // Create service principal
      const request: CreateServicePrincipalRequest = {
        subscriptionId: formData.subscriptionId,
        displayName: formData.displayName,
        accessToken: azureToken,
        autoAssignContributorRole: formData.autoAssignContributorRole,
      };

      const creationResult = await azureService.createServicePrincipal(request);
      setResult(creationResult);
      setStep("result");

      if (creationResult.success && onCreated) {
        onCreated(creationResult);
      }
    } catch (error: any) {
      console.error("Failed to create service principal:", error);
      setError(
        error.response?.data?.message ||
          "Failed to create service principal. Please try again."
      );
      setStep("azure-auth");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const resetDialog = () => {
    setStep("form");
    setFormData({
      subscriptionId: "",
      displayName: "",
      autoAssignContributorRole: true,
    });
    setAzureToken("");
    setResult(null);
    setError(null);
    setLoading(false);
    setShowSecret(false);
    setCopied(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  const renderFormStep = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Service Principal Name *</Label>
        <Input
          id="displayName"
          placeholder="e.g., Easel-MyProject-SP"
          value={formData.displayName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, displayName: e.target.value }))
          }
          required
        />
        <p className="text-sm text-muted-foreground">
          A descriptive name for your service principal
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscriptionId">Azure Subscription ID *</Label>
        <Input
          id="subscriptionId"
          placeholder="00000000-0000-0000-0000-000000000000"
          value={formData.subscriptionId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, subscriptionId: e.target.value }))
          }
          required
        />
        <p className="text-sm text-muted-foreground">
          The subscription where the service principal will be used
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="autoAssignRole"
          checked={formData.autoAssignContributorRole}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              autoAssignContributorRole: e.target.checked,
            }))
          }
          className="rounded border-gray-300"
        />
        <Label htmlFor="autoAssignRole" className="text-sm">
          Automatically assign Contributor role to subscription
        </Label>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          Next
        </Button>
      </div>
    </form>
  );

  const renderAzureAuthStep = () => (
    <div className="space-y-4">
      <AzureAuthGuide />

      <div className="space-y-2">
        <Label htmlFor="azureToken">Azure Access Token *</Label>
        <Textarea
          id="azureToken"
          placeholder="Paste your Azure access token here..."
          value={azureToken}
          onChange={(e) => setAzureToken(e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => setStep("form")}>
          Back
        </Button>
        <Button onClick={handleAzureAuth} disabled={loading || !azureToken}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Service Principal
        </Button>
      </div>
    </div>
  );

  const renderCreatingStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <h3 className="text-lg font-medium">Creating Service Principal...</h3>
      <p className="text-sm text-muted-foreground text-center">
        This may take a few moments. We're creating your service principal and
        assigning the necessary permissions.
      </p>
    </div>
  );

  const renderResultStep = () => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        {result.success ? (
          <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Service principal created successfully!{" "}
                {result.contributorRoleAssigned
                  ? "Contributor role has been assigned."
                  : "Please assign the Contributor role manually in Azure Portal."}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={result.displayName || ""} readOnly />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopy(result.displayName || "", "displayName")
                      }
                    >
                      {copied === "displayName" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Client ID (Application ID)</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={result.clientId || ""} readOnly />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopy(result.clientId || "", "clientId")
                      }
                    >
                      {copied === "clientId" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={result.clientSecret || ""}
                      readOnly
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopy(result.clientSecret || "", "clientSecret")
                      }
                    >
                      {copied === "clientSecret" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tenant ID</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={result.tenantId || ""} readOnly />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopy(result.tenantId || "", "tenantId")
                      }
                    >
                      {copied === "tenantId" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Save these credentials securely.
                  The client secret cannot be retrieved again. The credentials
                  have been automatically saved to your Easel account.
                </AlertDescription>
              </Alert>
            </div>
          </>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Failed to create service principal:</strong>
              <br />
              {result.errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={() => setIsOpen(false)}>Done</Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Service Principal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Create Azure Service Principal
          </DialogTitle>
          <DialogDescription>
            Create a new service principal with Contributor role for seamless
            Azure resource management.
          </DialogDescription>
        </DialogHeader>

        {step === "form" && renderFormStep()}
        {step === "azure-auth" && renderAzureAuthStep()}
        {step === "creating" && renderCreatingStep()}
        {step === "result" && renderResultStep()}
      </DialogContent>
    </Dialog>
  );
}
