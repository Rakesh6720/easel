"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { azureService, RoleAssignmentResult } from "@/lib/azure";
import { AzureAuthGuide } from "./azure-auth-guide";
import {
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AssignRoleDialogProps {
  credentialId: number;
  credentialName: string;
  onRoleAssigned?: () => void;
  children?: React.ReactNode;
}

export function AssignRoleDialog({
  credentialId,
  credentialName,
  onRoleAssigned,
  children,
}: AssignRoleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"auth" | "assigning" | "result">("auth");
  const [azureToken, setAzureToken] = useState("");
  const [result, setResult] = useState<RoleAssignmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAssignRole = async () => {
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

      setStep("assigning");

      // Assign role
      const assignmentResult =
        await azureService.assignContributorRoleToCredential(
          credentialId,
          azureToken
        );
      setResult(assignmentResult);
      setStep("result");

      if (assignmentResult.success && onRoleAssigned) {
        onRoleAssigned();
      }
    } catch (error: any) {
      console.error("Failed to assign role:", error);
      setError(
        error.response?.data?.message ||
          "Failed to assign Contributor role. Please try again."
      );
      setStep("auth");
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("auth");
    setAzureToken("");
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  const renderAuthStep = () => (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>What this does:</strong> This will assign the Contributor role
          to your existing service principal "<strong>{credentialName}</strong>"
          on the associated Azure subscription. You'll need your Azure access
          token to authorize this change.
        </AlertDescription>
      </Alert>

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
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
        <Button onClick={handleAssignRole} disabled={loading || !azureToken}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assign Contributor Role
        </Button>
      </div>
    </div>
  );

  const renderAssigningStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <h3 className="text-lg font-medium">Assigning Contributor Role...</h3>
      <p className="text-sm text-muted-foreground text-center">
        This may take a few moments. We're updating the role assignments for
        your service principal.
      </p>
    </div>
  );

  const renderResultStep = () => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        {result.success ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {result.roleAlreadyAssigned
                ? `Service principal "${credentialName}" already has the Contributor role assigned.`
                : `Contributor role has been successfully assigned to "${credentialName}"!`}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Failed to assign Contributor role:</strong>
              <br />
              {result.errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {result.message && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{result.message}</p>
          </div>
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
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Assign Contributor Role
          </DialogTitle>
          <DialogDescription>
            Add Contributor role to "{credentialName}" for full Azure resource
            management permissions.
          </DialogDescription>
        </DialogHeader>

        {step === "auth" && renderAuthStep()}
        {step === "assigning" && renderAssigningStep()}
        {step === "result" && renderResultStep()}
      </DialogContent>
    </Dialog>
  );
}
