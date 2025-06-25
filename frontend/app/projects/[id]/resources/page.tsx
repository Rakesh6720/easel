"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getResourcesForProject } from "@/lib/mock-resource-data";

export default function ProjectResourcesPage() {
  const params = useParams();
  const projectId = params.id as string;

  // Get resources for this project
  const resources = getResourcesForProject(parseInt(projectId, 10));

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">
            Manage Azure resources for Project {projectId}
          </p>
        </div>
        <Button asChild>
          <Link href={`/projects/${projectId}/resources/new`}>
            Add Resource
          </Link>
        </Button>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-4">
                This project doesn't have any Azure resources yet.
              </p>
              <Button asChild>
                <Link href={`/projects/${projectId}/resources/new`}>
                  Add Your First Resource
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <CardDescription>{resource.type}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      resource.status === "running"
                        ? "default"
                        : resource.status === "stopped"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {resource.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Region:</span>{" "}
                    {resource.region}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Resource Group:</span>{" "}
                    {resource.resourceGroup}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link
                      href={`/projects/${projectId}/resources/${resource.id}`}
                    >
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}`}>← Back to Project</Link>
        </Button>
      </div>
    </div>
  );
}
