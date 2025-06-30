"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  TrendingUp,
  DollarSign,
  Server,
  Plus,
  ArrowUpRight,
  Cloud,
  Database,
  Globe,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  mockDashboardStats,
  mockRecentProjects,
  mockResourceTypes,
  type DashboardStat,
  type RecentProject,
  type ResourceType,
} from "@/lib/mock-dashboard-data";
import { isTestUser } from "@/lib/test-user";
import { projectsService } from "@/lib/projects";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Use projectsService.getProjects() for both test and real users
        try {
          const projects = await projectsService.getProjects();

          // Convert projects to recent projects format for dashboard
          const recentProjectsData: RecentProject[] = projects
            .slice(0, 3)
            .map((project) => ({
              id: project.id,
              name: project.name,
              status: project.status,
              resources: project.resources?.length || 0,
              cost:
                project.resources?.reduce(
                  (sum, resource) =>
                    sum + (resource.estimatedMonthlyCost || 0),
                  0
                ) || 0,
              lastUpdated: new Date(project.updatedAt).toLocaleDateString(),
              }));

            setRecentProjects(recentProjectsData);

            // For test users, also set mock stats and resource types
            if (isTestUser()) {
              setStats(mockDashboardStats);
              setResourceTypes(mockResourceTypes);
            } else {
              // TODO: Replace with actual API calls for stats and resource types
              setStats([]);
              setResourceTypes([]);
            }
          } catch (error) {
            console.error("Error fetching projects:", error);
            // Fallback to empty state or mock data for test users
            if (isTestUser()) {
              setRecentProjects(mockRecentProjects);
              setStats(mockDashboardStats);
              setResourceTypes(mockResourceTypes);
            } else {
              setRecentProjects([]);
              setStats([]);
              setResourceTypes([]);
            }
          }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Azure resources and projects
          </p>
        </div>
        <Button variant="azure" asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.trend === "up" ? "text-azure-green" : "text-azure-red"
                }`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your most recently updated projects
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects">
                  View All
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 azure-gradient rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {project.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{project.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{project.resources} resources</span>
                        <span>{formatCurrency(project.cost)}/month</span>
                        <span>Updated {project.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`status-indicator ${
                        project.status === "Active"
                          ? "status-running"
                          : "status-provisioning"
                      }`}
                    >
                      {project.status}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${project.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Types */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Types</CardTitle>
            <CardDescription>
              Distribution of your Azure resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resourceTypes.map((type) => (
                <div
                  key={type.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center`}
                    >
                      <type.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">
                    {type.count}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6" asChild>
              <Link href="/resources">
                View All Resources
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
