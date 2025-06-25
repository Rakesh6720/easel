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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ArrowLeft,
  Calendar,
  PieChart,
  LineChart,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

// Mock analytics data
const analyticsOverview = {
  totalResources: 24,
  activeProjects: 8,
  monthlySpend: 3247.83,
  utilizationRate: 78.5,
  growthRate: 15.2,
  alertsActive: 3,
};

const resourceUtilization = [
  {
    category: "Compute",
    totalResources: 12,
    utilizationRate: 82.3,
    trend: "up",
    change: "+5.2%",
    cost: 1456.78,
  },
  {
    category: "Storage",
    totalResources: 8,
    utilizationRate: 65.1,
    trend: "down",
    change: "-2.1%",
    cost: 678.45,
  },
  {
    category: "Database",
    totalResources: 3,
    utilizationRate: 91.2,
    trend: "up",
    change: "+8.3%",
    cost: 892.34,
  },
  {
    category: "Networking",
    totalResources: 1,
    utilizationRate: 45.6,
    trend: "up",
    change: "+1.8%",
    cost: 220.26,
  },
];

const projectPerformance = [
  {
    id: 1,
    name: "E-commerce Platform",
    resources: 9,
    uptime: 99.9,
    cost: 1247.83,
    efficiency: 85.2,
    status: "healthy",
  },
  {
    id: 2,
    name: "Analytics Dashboard",
    resources: 2,
    uptime: 99.7,
    cost: 456.78,
    efficiency: 92.1,
    status: "healthy",
  },
  {
    id: 3,
    name: "Mobile App Backend",
    resources: 4,
    uptime: 98.9,
    cost: 678.45,
    efficiency: 76.8,
    status: "warning",
  },
];

const costTrends = [
  { month: "Aug", amount: 2890.45 },
  { month: "Sep", amount: 3120.67 },
  { month: "Oct", amount: 2956.23 },
  { month: "Nov", amount: 3247.83 },
  { month: "Dec", amount: 3389.12 },
];

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
        <span>Analytics</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics & Insights
          </h1>
          <p className="text-muted-foreground">
            Monitor resource utilization, costs, and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Resources
                </p>
                <p className="text-2xl font-bold">
                  {analyticsOverview.totalResources}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </p>
                <p className="text-2xl font-bold">
                  {analyticsOverview.activeProjects}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Spend
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(analyticsOverview.monthlySpend)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Utilization
                </p>
                <p className="text-2xl font-bold">
                  {analyticsOverview.utilizationRate}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Growth Rate
                </p>
                <p className="text-2xl font-bold text-green-600">
                  +{analyticsOverview.growthRate}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Alerts
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {analyticsOverview.alertsActive}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resource Utilization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resource Utilization by Category</CardTitle>
            <CardDescription>
              Current utilization rates and cost breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {resourceUtilization.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 azure-gradient rounded-full" />
                      <span className="font-medium">{category.category}</span>
                      <Badge variant="secondary">
                        {category.totalResources} resources
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">
                        {formatCurrency(category.cost)}
                      </span>
                      <div className="flex items-center text-sm">
                        {category.trend === "up" ? (
                          <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                        )}
                        <span
                          className={
                            category.trend === "up"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {category.change}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="azure-gradient h-2 rounded-full transition-all"
                        style={{ width: `${category.utilizationRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {category.utilizationRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Trends</CardTitle>
            <CardDescription>Monthly spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-48 flex items-end justify-between bg-muted/20 p-4 rounded">
                {costTrends.map((trend, index) => {
                  const maxAmount = Math.max(
                    ...costTrends.map((t) => t.amount)
                  );
                  const height = (trend.amount / maxAmount) * 150;
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="bg-azure-blue rounded-t w-8 transition-all"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-xs text-muted-foreground mt-2">
                        {trend.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Current month:{" "}
                  {formatCurrency(costTrends[costTrends.length - 1].amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance Overview</CardTitle>
          <CardDescription>
            Detailed metrics for each active project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectPerformance.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 azure-gradient rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{project.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{project.resources} resources</span>
                      <span>Uptime: {project.uptime}%</span>
                      <span>Efficiency: {project.efficiency}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(project.cost)}
                    </p>
                    <p className="text-sm text-muted-foreground">monthly</p>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${project.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze spending patterns and identify optimization opportunities.
            </p>
            <Button className="w-full" asChild>
              <Link href="/billing">View Detailed Analysis</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="mr-2 h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor resource performance and application health metrics.
            </p>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/projects">View All Projects</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Resource Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get AI-powered recommendations to optimize your Azure resources.
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
