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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  Copy,
  Terminal,
} from "lucide-react";

interface AzureAuthGuideProps {
  onTokenObtained?: (token: string) => void;
}

export function AzureAuthGuide({ onTokenObtained }: AzureAuthGuideProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const azureCLICommand = `az account get-access-token --resource https://graph.microsoft.com/ --query accessToken --output tsv`;
  const browserConsoleScript = `
// Copy and paste this in Azure Portal's browser console
JSON.parse(localStorage.getItem('msal.account.keys')).split(',')[0]
`.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Get Azure Access Token
        </CardTitle>
        <CardDescription>
          To create a service principal, you need to provide an Azure access
          token for Microsoft Graph API.
          <br />
          <strong>Note:</strong> Service principal creation and role assignment
          require different token scopes, so they're done in separate steps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cli" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cli">Azure CLI (Recommended)</TabsTrigger>
            <TabsTrigger value="browser">Browser Console</TabsTrigger>
          </TabsList>

          <TabsContent value="cli" className="space-y-4">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended:</strong> Use Azure CLI for secure token
                generation.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Step 1: Install Azure CLI</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  If you don't have Azure CLI installed, visit:
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Install Azure CLI
                  </a>
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Step 2: Sign in to Azure</h4>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-sm">az login</code>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  Step 3: Get Access Token for Microsoft Graph
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  This command gets a token specifically for Microsoft Graph
                  API, which is required for service principal operations:
                </p>
                <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                  <code className="text-sm font-mono">{azureCLICommand}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(azureCLICommand, "cli")}
                  >
                    {copied === "cli" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Run this command in your terminal and copy the output token.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="browser" className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This method exposes your token in the
                browser console. Use only for testing.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Step 1: Open Azure Portal</h4>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://portal.azure.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Azure Portal
                  </a>
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  Step 2: Open Developer Tools
                </h4>
                <div className="text-sm text-muted-foreground">
                  Press <Badge variant="outline">F12</Badge> or right-click and
                  select "Inspect"
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  Step 3: Run Script in Console
                </h4>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {browserConsoleScript}
                  </pre>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(browserConsoleScript, "browser")}
                  >
                    {copied === "browser" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copy Script
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Go to the Console tab and paste this script. The token will be
                  displayed.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This token is specifically for Microsoft
            Graph API to create service principals. Role assignment will be done
            separately and doesn't require a different token.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
