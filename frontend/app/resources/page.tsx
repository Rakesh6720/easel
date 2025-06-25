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
  Cloud,
  Server,
  Database,
  HardDrive,
  Network,
  Settings,
  ExternalLink,
  Filter,
  Search,
  Plus,
  ArrowLeft,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getResourceTypeIcon,
} from "@/lib/utils";
import {
  allMockResourcesData,
  ResourceData,
  resourceCategories,
  getResourceCategory,
} from "@/lib/mock-resource-data";
import Link from "next/link";

// Get all resources across all projects
const allResources: ResourceData[] = Object.values(allMockResourcesData);

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter resources based on category and search
  const filteredResources = allResources.filter((resource: ResourceData) => {
    const matchesCategory =
      selectedCategory === "all" ||
      getResourceCategory(resource.type) === selectedCategory;
    const matchesSearch =
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate resource statistics
  const resourceStats = {
    total: allResources.length,
    running: allResources.filter(
      (r: ResourceData) => r.status === "running" || r.status === "Active"
    ).length,
    stopped: allResources.filter(
      (r: ResourceData) => r.status === "stopped" || r.status === "Stopped"
    ).length,
    warning: allResources.filter(
      (r: ResourceData) => r.status === "warning" || r.status === "Warning"
    ).length,
    totalCost: allResources.reduce(
      (sum: number, r: ResourceData) => sum + r.cost,
      0
    ),
  };

  // Group resources by category for overview
  const resourcesByCategory = resourceCategories.slice(1).map((category) => ({
    ...category,
    count: allResources.filter(
      (r: ResourceData) => getResourceCategory(r.type) === category.value
    ).length,
    cost: allResources
      .filter(
        (r: ResourceData) => getResourceCategory(r.type) === category.value
      )
      .reduce((sum: number, r: ResourceData) => sum + r.cost, 0),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-azure-blue flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Dashboard
        </Link>
        <span>/</span>
        <span>Resources</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Azure Resources</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your Azure resources across projects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Resource Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Resources
                </p>
                <p className="text-2xl font-bold">{resourceStats.total}</p>
              </div>
              <Cloud className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Running
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {resourceStats.running}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Stopped
                </p>
                <p className="text-2xl font-bold text-gray-600">
                  {resourceStats.stopped}
                </p>
              </div>
              <Activity className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Warnings
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {resourceStats.warning}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cost
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(resourceStats.totalCost)}
                </p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Category Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Categories</CardTitle>
            <CardDescription>Resources grouped by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resourcesByCategory.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.value}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.count} resources
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(category.cost)}
                      </p>
                      <p className="text-xs text-muted-foreground">monthly</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resources List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Resources</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    className="pl-8 pr-4 py-2 border rounded-md text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* Category Filter Tabs */}
            <div className="flex space-x-1 mt-4">
              {resourceCategories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedCategory === category.value
                      ? "bg-azure-blue text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredResources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No resources found matching your criteria</p>
                </div>
              ) : (
                filteredResources.map((resource: ResourceData) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 hover:border-azure-blue transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getResourceTypeIcon(resource.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{resource.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{resource.type}</span>
                          <span>{resource.region}</span>
                          <span>{formatCurrency(resource.cost)}/month</span>
                          <span>Created {formatDate(resource.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(resource.status)}>
                        {resource.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://portal.azure.com/#@/resource${resource.azureResourceId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Portal
                        </a>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Create New Resource
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Deploy new Azure resources with AI-powered recommendations.
            </p>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Resource Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor the health and performance of all your resources.
            </p>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Bulk Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Perform bulk operations on multiple resources at once.
            </p>
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
