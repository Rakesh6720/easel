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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";

interface SubscriptionIssue {
  service: string;
  issue: string;
  solution: string;
  cost: string;
  urgency: "high" | "medium" | "low";
}

interface UpgradeOption {
  name: string;
  description: string;
  monthlyPrice: string;
  features: string[];
  limitations: string[];
  bestFor: string;
  actionUrl: string;
}

export function AzureSubscriptionUpgrade() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const detectedIssues: SubscriptionIssue[] = [
    {
      service: "Service Principal Permissions",
      issue: "Service Principal lacks 'Reader' role on subscription",
      solution: "Assign at least 'Reader' role to Service Principal",
      cost: "Free (permission assignment)",
      urgency: "high"
    },
    {
      service: "App Services",
      issue: "No VM quota (Free, Basic, Standard tiers)",
      solution: "Upgrade to Pay-As-You-Go or request quota increase",
      cost: "$13-55/month per app",
      urgency: "high"
    },
    {
      service: "SQL Database",
      issue: "Provisioning disabled in multiple regions",
      solution: "Enable SQL Database service or request regional access",
      cost: "$5-15/month per database",
      urgency: "high"
    },
    {
      service: "Cosmos DB",
      issue: "Microsoft.DocumentDB namespace not registered",
      solution: "Register resource provider in subscription",
      cost: "Free (registration only)",
      urgency: "medium"
    },
    {
      service: "Application Insights",
      issue: "microsoft.operationalinsights provider not registered",
      solution: "Register resource provider in subscription",
      cost: "Free (registration only)",
      urgency: "medium"
    }
  ];

  const upgradeOptions: UpgradeOption[] = [
    {
      name: "Pay-As-You-Go",
      description: "Most popular option for development and production",
      monthlyPrice: "Pay only for what you use",
      features: [
        "Full access to all Azure services",
        "No upfront commitment",
        "Scale up and down as needed",
        "Support for production workloads",
        "Access to all regions"
      ],
      limitations: [
        "Higher per-unit costs",
        "No included credits"
      ],
      bestFor: "Production apps and growing projects",
      actionUrl: "https://azure.microsoft.com/en-us/pricing/purchase-options/pay-as-you-go/"
    },
    {
      name: "Azure for Students",
      description: "Free credits for educational use",
      monthlyPrice: "$0 (with $100 credit)",
      features: [
        "$100 in Azure credits",
        "Free access to popular services",
        "No credit card required",
        "12 months of free services"
      ],
      limitations: [
        "Must be a student",
        "Limited to educational use",
        "Some service restrictions"
      ],
      bestFor: "Learning and academic projects",
      actionUrl: "https://azure.microsoft.com/en-us/free/students/"
    },
    {
      name: "Visual Studio Subscription",
      description: "Monthly Azure credits included",
      monthlyPrice: "$45-250/month (includes Azure credits)",
      features: [
        "$50-150 monthly Azure credits",
        "Visual Studio IDE included",
        "Dev/Test pricing",
        "Priority support"
      ],
      limitations: [
        "Higher monthly cost",
        "Dev/Test use only for credits"
      ],
      bestFor: "Professional developers and teams",
      actionUrl: "https://visualstudio.microsoft.com/subscriptions/"
    }
  ];

  const registrationSteps = [
    {
      title: "Fix Service Principal Permissions (CRITICAL)",
      description: "Your Service Principal needs at least 'Reader' role",
      command: "Search 'Subscriptions' → Select subscription → Access control (IAM) → Add role assignment"
    },
    {
      title: "Assign Reader Role",
      description: "Role: Reader, Assign access to: Service Principal, Search for your app ID:",
      command: "Your Service Principal Client ID (from Azure credentials)"
    },
    {
      title: "Open Azure Portal",
      description: "Navigate to portal.azure.com and sign in",
      command: "portal.azure.com"
    },
    {
      title: "Go to Subscriptions",
      description: "Search for 'Subscriptions' in the top search bar",
      command: "Subscriptions"
    },
    {
      title: "Select Your Subscription",
      description: "Click on your current subscription",
      command: ""
    },
    {
      title: "Resource Providers",
      description: "In the left menu, click 'Resource providers'",
      command: "Resource providers"
    },
    {
      title: "Register Required Providers",
      description: "Search and register these providers:",
      command: "Microsoft.DocumentDB\nmicrosoft.operationalinsights\nMicrosoft.Web\nMicrosoft.Sql"
    },
    {
      title: "Request Quota Increase",
      description: "Go to 'Usage + quotas' to request VM quota increase",
      command: "Usage + quotas"
    }
  ];

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-800">Azure Subscription Issues Detected</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          Your current Azure subscription has limitations that prevent resource provisioning. 
          Here's how to resolve them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Issues */}
          <div>
            <h4 className="font-semibold text-orange-800 mb-3">Detected Issues</h4>
            <div className="space-y-2">
              {detectedIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{issue.service}</span>
                      <Badge className={getUrgencyColor(issue.urgency)}>
                        {issue.urgency}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{issue.issue}</p>
                    <p className="text-sm text-green-700 mt-1">💡 {issue.solution}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{issue.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Fix for Resource Providers */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Quick Fix: Register Resource Providers (Free)</AlertTitle>
            <AlertDescription>
              Some issues can be resolved for free by registering Azure resource providers.
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 h-auto text-blue-600">
                    View step-by-step guide →
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Register Azure Resource Providers</DialogTitle>
                    <DialogDescription>
                      Follow these steps to register the required resource providers for free.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {registrationSteps.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{step.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            {step.command && (
                              <div className="mt-2 flex items-center space-x-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                                  {step.command}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(step.command, index)}
                                >
                                  {copiedStep === index ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </AlertDescription>
          </Alert>

          {/* Subscription Upgrade Options */}
          <div>
            <h4 className="font-semibold text-orange-800 mb-3">Subscription Upgrade Options</h4>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
              {upgradeOptions.map((option, index) => (
                <Card key={index} className="border-gray-200">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{option.name}</CardTitle>
                    </div>
                    <CardDescription>{option.description}</CardDescription>
                    <div className="text-2xl font-bold text-green-600">{option.monthlyPrice}</div>
                    <p className="text-sm text-gray-600">{option.bestFor}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">✅ Features</h5>
                        <ul className="text-sm space-y-1">
                          {option.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {option.limitations.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">⚠️ Limitations</h5>
                          <ul className="text-sm space-y-1 text-gray-600">
                            {option.limitations.map((limitation, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="text-gray-400">•</span>
                                <span>{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full" 
                        onClick={() => window.open(option.actionUrl, '_blank')}
                      >
                        Get Started
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Azure Portal
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('https://azure.microsoft.com/en-us/support/options/', '_blank')}
            >
              <Users className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-providers-and-types', '_blank')}
            >
              <Zap className="mr-2 h-4 w-4" />
              Resource Provider Docs
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}