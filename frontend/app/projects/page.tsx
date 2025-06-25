"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Calendar,
  DollarSign,
  Server,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { projectsService, type Project } from "@/lib/projects";
import Link from "next/link";

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return <Play className="h-4 w-4 text-azure-green" />;
    case "provisioning":
      return (
        <div className="h-4 w-4 rounded-full bg-azure-light-blue animate-pulse" />
      );
    case "error":
      return <Pause className="h-4 w-4 text-azure-red" />;
    default:
      return <div className="h-4 w-4 rounded-full bg-azure-gray-400" />;
  }
};

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const fetchedProjects = await projectsService.getProjects();
        setProjects(fetchedProjects);
        setError(null);
      } catch (err) {
        setError('Failed to load projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return projects;
    }

    const searchLower = searchTerm.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.userRequirements.toLowerCase().includes(searchLower) ||
        project.status.toLowerCase().includes(searchLower)
    );
  }, [projects, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI-powered Azure projects
          </p>
        </div>
        <Button variant="azure" asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
          {searchTerm && (
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredProjects.length === 0
                ? "No projects found matching your search"
                : `Showing ${filteredProjects.length} of ${projects.length} projects`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-azure-blue mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No projects found matching your search' : 'No projects yet'}
            </p>
            <Button variant="azure" asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 azure-gradient rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {project.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-azure-blue transition-colors">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(project.status)}
                      <span
                        className={`text-sm font-medium ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {project.resources?.length || 0} resources
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatCurrency(
                        project.resources?.reduce((sum, r) => sum + (r.estimatedMonthlyCost || 0), 0) || 0
                      )}/mo
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(project.createdAt)}</span>
                  </div>
                  <div>Updated {formatDate(project.updatedAt)}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/projects/${project.id}`}>View Details</Link>
                  </Button>
                  {project.status === "Active" && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/projects/${project.id}/resources`}>
                        Resources
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
}
