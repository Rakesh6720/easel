"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { projectsService, type Project } from "@/lib/projects";
import Link from "next/link";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string, 10);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    userRequirements: "",
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const projectData = await projectsService.getProject(projectId);
        setProject(projectData);
        setFormData({
          name: projectData.name || "",
          description: projectData.description || "",
          userRequirements: projectData.userRequirements || "",
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await projectsService.updateProject(projectId, {
        name: formData.name,
        description: formData.description,
        userRequirements: formData.userRequirements,
      });

      // Navigate back to project details
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.userRequirements.trim();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Project Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            {error || "The requested project could not be found."}
          </p>
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/projects"
          className="hover:text-azure-blue flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Projects
        </Link>
        <span>/</span>
        <Link
          href={`/projects/${projectId}`}
          className="hover:text-azure-blue"
        >
          {project?.name}
        </Link>
        <span>/</span>
        <span>Edit</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-muted-foreground">
            Update your project details and requirements
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Modify your project information and requirements below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter project name"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of your project"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.userRequirements}
              onChange={(e) => handleInputChange("userRequirements", e.target.value)}
              placeholder="Describe what you want to build, your technical requirements, expected scale, and any specific needs"
              rows={6}
              disabled={saving}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Link href={`/projects/${projectId}`}>
              <Button variant="outline" disabled={saving}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </Link>
            <Button 
              onClick={handleSave} 
              disabled={!isFormValid || saving}
              className="bg-azure-blue hover:bg-azure-blue/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}