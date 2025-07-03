"use client";

import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Shield,
} from "lucide-react";

interface AzurePermissionErrorProps {
  credentialName?: string;
  servicePrincipalId?: string;
  subscriptionId?: string;
}

export function AzurePermissionError({ 
  credentialName = "Azure Credentials",
  servicePrincipalId,
  subscriptionId
}: AzurePermissionErrorProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const steps = [
    {
      title: "Open Azure Portal",
      description: "Navigate to the Azure Portal and sign in with your account",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://portal.azure.com', '_blank')}
        >
          Open Azure Portal
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    {
      title: "Navigate to Your Subscription",
      description: "Go to Subscriptions and select your subscription",
      copyText: subscriptionId,
      copyLabel: "Subscription ID",
      action: (
        <div className="flex items-center space-x-2">
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{subscriptionId}</code>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(subscriptionId, 'subscription')}
          >
            {copiedItem === 'subscription' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )
    },
    {
      title: "Open Access Control (IAM)",
      description: "In the left sidebar, click on 'Access control (IAM)'",
      action: null
    },
    {
      title: "Add Role Assignment",
      description: "Click on '+ Add' button and select 'Add role assignment'",
      action: null
    },
    {
      title: "Select Role",
      description: "Choose 'Contributor' role (or at minimum 'Reader' role)",
      action: (
        <div className="space-y-2">
          <div className="p-2 border rounded-lg">
            <p className="font-semibold">Recommended: Contributor</p>
            <p className="text-sm text-gray-600">Can manage all resources</p>
          </div>
          <div className="p-2 border rounded-lg">
            <p className="font-semibold">Minimum: Reader</p>
            <p className="text-sm text-gray-600">Can only view resources</p>
          </div>
        </div>
      )
    },
    {
      title: "Assign to Service Principal",
      description: "Select 'User, group, or service principal' and search for this ID:",
      copyText: servicePrincipalId,
      copyLabel: "Service Principal ID",
      action: (
        <div className="flex items-center space-x-2">
          <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">{servicePrincipalId}</code>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(servicePrincipalId, 'principal')}
          >
            {copiedItem === 'principal' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )
    },
    {
      title: "Save Assignment",
      description: "Click 'Review + assign' then 'Assign' to save the role assignment",
      action: null
    },
    {
      title: "Wait for Propagation",
      description: "Wait 1-2 minutes for permissions to propagate, then retry",
      action: null
    }
  ];

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Critical: Azure Service Principal Lacks Permissions</AlertTitle>
      <AlertDescription className="text-red-700">
        <div className="space-y-4 mt-2">
          <p>
            Your Azure Service Principal doesn't have the required permissions to access the subscription. 
            This is blocking all Azure operations.
          </p>
          
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Quick Info
            </h4>
            <div className="space-y-1 text-sm">
              <p><strong>Service Principal ID:</strong> {servicePrincipalId}</p>
              <p><strong>Missing Permission:</strong> Microsoft.Resources/subscriptions/read</p>
              <p><strong>Required Role:</strong> Reader (minimum) or Contributor (recommended)</p>
              <p><strong>Time to Fix:</strong> ~5 minutes</p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Fix Permissions Now (Step-by-Step Guide)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Fix Azure Service Principal Permissions</DialogTitle>
                <DialogDescription>
                  Follow these steps to grant the required permissions to your Service Principal.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      {step.action && (
                        <div className="mt-2">
                          {step.action}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">⚡ Pro Tip</h4>
                <p className="text-sm text-blue-700">
                  If you're still getting permission errors after following these steps, try:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>Signing out and back into Azure Portal</li>
                  <li>Clearing your browser cache</li>
                  <li>Waiting an additional 5 minutes for propagation</li>
                  <li>Verifying you selected the correct subscription</li>
                </ul>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://docs.microsoft.com/en-us/azure/role-based-access-control/overview', '_blank')}
                >
                  Learn More About Azure RBAC
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionBlade/subscriptionId/${subscriptionId}`, '_blank')}
            >
              Open Subscription
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps', '_blank')}
            >
              View App Registrations
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}