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
// Using native HTML checkbox since Checkbox component doesn't exist
import {
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Server,
  Database,
  Cloud,
  BarChart3,
  Shield,
  Zap,
  Play,
  MessageSquare,
  Settings,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { projectsService } from "@/lib/projects";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AzureResourceRecommendation {
  id: string;
  name: string;
  resourceType: string;
  sku: string;
  location: string;
  estimatedMonthlyCost: number;
  description: string;
  justification: string;
  features: string[];
  priority: "High" | "Medium" | "Low";
  isRecommended: boolean;
}

const getResourceIcon = (resourceType: string) => {
  if (resourceType.includes("web/sites")) return <Server className="h-6 w-6" />;
  if (resourceType.includes("sql")) return <Database className="h-6 w-6" />;
  if (resourceType.includes("storage")) return <Cloud className="h-6 w-6" />;
  if (resourceType.includes("insights"))
    return <BarChart3 className="h-6 w-6" />;
  if (resourceType.includes("cache")) return <Zap className="h-6 w-6" />;
  if (resourceType.includes("keyvault")) return <Shield className="h-6 w-6" />;
  return <Server className="h-6 w-6" />;
};

export default function RecommendationsPage() {
  const params = useParams();
  const [recommendations, setRecommendations] = useState<
    AzureResourceRecommendation[]
  >([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateRecommendations();
  }, [params.id]);

  const generateRecommendations = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const data = await projectsService.generateRecommendations(
        parseInt(params.id as string)
      );
      console.log("Received recommendations:", data);
      console.log("First recommendation:", data[0]);
      console.log("First recommendation ID:", data[0]?.id);
      
      // Add IDs to recommendations if they don't have them
      const recommendationsWithIds = data.map((rec: any, index: number) => ({
        ...rec,
        id: rec.id || `rec_${Date.now()}_${index}`,
        isRecommended: rec.isRecommended !== false // Default to true if not specified
      }));
      
      setRecommendations(recommendationsWithIds);

      // Auto-select recommended resources
      const recommendedIds = recommendationsWithIds
        .filter((r: AzureResourceRecommendation) => r.isRecommended && r.id)
        .map((r: AzureResourceRecommendation) => r.id);
      console.log("Auto-selecting recommended IDs:", recommendedIds);
      setSelectedResources(recommendedIds);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate recommendations"
      );
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  const handleResourceToggle = (resourceId: string) => {
    console.log("Toggling resource:", resourceId);
    console.log("Current selected resources:", selectedResources);

    if (!resourceId) {
      console.error("Resource ID is undefined or null");
      return;
    }

    setSelectedResources((prev) => {
      const newSelection = prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId];
      console.log("New selected resources:", newSelection);
      return newSelection;
    });
  };

  const selectedResourcesData = recommendations.filter((r) =>
    selectedResources.includes(r.id)
  );
  const totalMonthlyCost = selectedResourcesData.reduce(
    (sum, resource) => sum + resource.estimatedMonthlyCost,
    0
  );

  const handleProvision = async () => {
    setIsProvisioning(true);

    try {
      const selectedRecommendations = recommendations.filter(
        (r) => r.id && selectedResources.includes(r.id)
      );

      if (selectedRecommendations.length === 0) {
        setError("No valid resources selected for provisioning");
        return;
      }

      console.log("Provisioning project ID:", parseInt(params.id as string));
      console.log("Selected recommendations:", selectedRecommendations);

      await projectsService.provisionResources(
        parseInt(params.id as string),
        selectedRecommendations
      );

      // Redirect to project detail page
      window.location.href = `/projects/${params.id}`;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to provision resources"
      );
    } finally {
      setIsProvisioning(false);
    }
  };

  if (isLoading || isGenerating) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-azure-blue">
            Projects
          </Link>
          <span>/</span>
          <Link
            href={`/projects/${params.id}`}
            className="hover:text-azure-blue"
          >
            Project Details
          </Link>
          <span>/</span>
          <span>Recommendations</span>
        </div>

        <Card className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-azure-blue" />
            <h3 className="text-lg font-semibold">
              Generating AI Recommendations
            </h3>
            <p className="text-muted-foreground max-w-md">
              Our AI is analyzing your project requirements and generating
              optimized Azure resource recommendations...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-azure-blue">
            Projects
          </Link>
          <span>/</span>
          <Link
            href={`/projects/${params.id}`}
            className="hover:text-azure-blue"
          >
            Project Details
          </Link>
          <span>/</span>
          <span>Recommendations</span>
        </div>

        <Card className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-red-600">
              Error Loading Recommendations
            </h3>
            <p className="text-muted-foreground max-w-md">{error}</p>
            <Button onClick={generateRecommendations} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-azure-blue">
          Projects
        </Link>
        <span>/</span>
        <Link href={`/projects/${params.id}`} className="hover:text-azure-blue">
          Project Details
        </Link>
        <span>/</span>
        <span>Recommendations</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Azure Resource Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered recommendations based on your project requirements
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={generateRecommendations}
            disabled={isGenerating}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
            />
            Regenerate
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommendations List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recommended Resources</h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-azure-green" />
              <span>AI Recommended</span>
            </div>
          </div>

          {recommendations
            .filter((resource) => resource && resource.id)
            .map((resource) => (
              <Card
                key={resource.id}
                className={`transition-all duration-200 ${
                  selectedResources.includes(resource.id)
                    ? "ring-2 ring-azure-blue border-azure-blue"
                    : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={
                        resource.id
                          ? selectedResources.includes(resource.id)
                          : false
                      }
                      onChange={() =>
                        resource.id && handleResourceToggle(resource.id)
                      }
                      className="mt-1 h-4 w-4 text-azure-blue border-gray-300 rounded focus:ring-azure-blue"
                    />

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-azure-gradient rounded-lg flex items-center justify-center text-white">
                            {getResourceIcon(resource.resourceType)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg">
                                {resource.name}
                              </h3>
                              {resource.isRecommended && (
                                <Badge className="bg-azure-green text-white">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Recommended
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  resource.priority === "High"
                                    ? "destructive"
                                    : resource.priority === "Medium"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {resource.priority} Priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {resource.sku} • {resource.location}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {formatCurrency(resource.estimatedMonthlyCost)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            per month
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {resource.description}
                        </p>
                        <p className="text-sm font-medium text-azure-blue">
                          {resource.justification}
                        </p>
                      </div>

                      {resource.features && resource.features.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {resource.features.map((feature, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          {recommendations.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Recommendations Generated
                </h3>
                <p className="text-muted-foreground">
                  Unable to generate recommendations for this project. Try
                  regenerating or check your project requirements.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Cost Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {selectedResourcesData.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex justify-between text-sm"
                  >
                    <span>{resource.name}</span>
                    <span>{formatCurrency(resource.estimatedMonthlyCost)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Monthly Cost</span>
                  <span className="text-azure-blue">
                    {formatCurrency(totalMonthlyCost)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated cost based on standard usage
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resource Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Selected Resources</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-azure-blue">
                  {selectedResources.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  resources selected
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Deploy?</CardTitle>
              <CardDescription>
                Provision these resources to your Azure subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="azure"
                onClick={handleProvision}
                disabled={selectedResources.length === 0 || isProvisioning}
              >
                {isProvisioning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Provision Resources
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/projects/${params.id}/chat`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask AI Questions
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={generateRecommendations}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Recommendations
              </Button>
            </CardContent>
          </Card>

          {/* Note */}
          <Card className="bg-azure-gradient-subtle border-azure-blue/20">
            <CardContent className="p-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> These recommendations are based on your
                project requirements and current Azure best practices. You can
                modify configurations before provisioning or add additional
                resources later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
