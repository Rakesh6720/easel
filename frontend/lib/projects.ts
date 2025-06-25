import axios from "axios";
import { isTestUser } from "./test-user";
import { mockProjectsEnhanced, searchMockProjects } from "./mock-data-enhanced";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export interface Project {
  id: number;
  name: string;
  description: string;
  userRequirements: string;
  processedRequirements: string;
  status:
    | "Draft"
    | "Analyzing"
    | "ResourcesIdentified"
    | "Provisioning"
    | "Active"
    | "Error"
    | "Archived";
  createdAt: string;
  updatedAt: string;
  userId: number;
  userAzureCredentialId?: number;
  resources: AzureResource[];
  conversations: ProjectConversation[];
}

export interface AzureResource {
  id: number;
  name: string;
  resourceType: string;
  status: "Provisioning" | "Active" | "Error" | "Deleted";
  location: string;
  estimatedMonthlyCost: number;
  configuration: Record<string, any>;
  createdAt: string;
  provisionedAt?: string;
  deletedAt?: string;
}

export interface ProjectConversation {
  id: number;
  projectId: number;
  userMessage: string;
  aiResponse: string;
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  userRequirements: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

class ProjectsService {
  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async getProjects(): Promise<Project[]> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockProjectsEnhanced), 300); // Simulate API delay
      });
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async getProject(id: number): Promise<Project> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const project = mockProjectsEnhanced.find((p) => p.id === id);
          if (project) {
            resolve(project);
          } else {
            reject(new Error("Project not found"));
          }
        }, 200);
      });
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async createProject(request: CreateProjectRequest): Promise<Project> {
    // Simulate project creation for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newProject: Project = {
            id: Date.now(), // Simple ID generation
            name: request.name,
            description:
              "AI-generated project description based on requirements",
            userRequirements: request.userRequirements,
            processedRequirements: `Processed requirements for: ${request.userRequirements}`,
            status: "Analyzing",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 999999,
            resources: [],
            conversations: [],
          };
          resolve(newProject);
        }, 1500); // Simulate longer processing time
      });
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/projects`, request, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async updateProject(
    id: number,
    request: UpdateProjectRequest
  ): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/projects/${id}`, request, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async deleteProject(id: number, confirmed: boolean = false): Promise<any> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/projects/${id}?confirmed=${confirmed}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async getProjectConversations(id: number): Promise<ProjectConversation[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/projects/${id}/conversations`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async addConversation(
    id: number,
    message: string
  ): Promise<{ response: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/projects/${id}/conversation`,
        { message },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async generateRecommendations(id: number): Promise<any[]> {
    // Return mock recommendations for test user
    console.log("generateRecommendations called, isTestUser():", isTestUser());
    if (isTestUser()) {
      console.log("Using mock data for test user");
      return new Promise((resolve) => {
        setTimeout(
          () =>
            resolve([
              {
                id: "1",
                name: "web-app-eastus",
                resourceType: "Microsoft.Web/sites",
                sku: "Standard S1",
                location: "East US",
                estimatedMonthlyCost: 73.2,
                description: "Azure App Service for hosting web applications",
                justification:
                  "Perfect for hosting your web application with built-in scaling and monitoring",
                features: [
                  "Auto-scaling",
                  "Built-in monitoring",
                  "SSL certificates",
                  "Custom domains",
                ],
                priority: "High" as "High" | "Medium" | "Low",
                isRecommended: true,
              },
              {
                id: "2",
                name: "sql-db-eastus",
                resourceType: "Microsoft.Sql/servers/databases",
                sku: "Standard S2",
                location: "East US",
                estimatedMonthlyCost: 30.0,
                description: "Azure SQL Database for relational data storage",
                justification:
                  "Reliable and scalable database solution for your application data",
                features: [
                  "Automatic backups",
                  "Built-in security",
                  "Elastic scaling",
                  "High availability",
                ],
                priority: "High" as "High" | "Medium" | "Low",
                isRecommended: true,
              },
              {
                id: "3",
                name: "storage-eastus",
                resourceType: "Microsoft.Storage/storageAccounts",
                sku: "Standard LRS",
                location: "East US",
                estimatedMonthlyCost: 15.5,
                description: "Azure Storage Account for file and blob storage",
                justification:
                  "Cost-effective storage solution for application assets and user uploads",
                features: [
                  "99.999% availability",
                  "Multiple storage types",
                  "Global replication",
                  "Built-in security",
                ],
                priority: "Medium" as "High" | "Medium" | "Low",
                isRecommended: false,
              },
              {
                id: "4",
                name: "insights-eastus",
                resourceType: "Microsoft.Insights/components",
                sku: "Basic",
                location: "East US",
                estimatedMonthlyCost: 5.0,
                description:
                  "Application Insights for monitoring and analytics",
                justification:
                  "Essential for monitoring application performance and user behavior",
                features: [
                  "Real-time monitoring",
                  "Custom dashboards",
                  "Alerting",
                  "Performance analytics",
                ],
                priority: "Medium" as "High" | "Medium" | "Low",
                isRecommended: true,
              },
            ]),
          500
        ); // Simulate API delay
      });
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/projects/${id}/generate-recommendations`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async provisionResources(id: number, recommendations: any[]): Promise<void> {
    // For test user, just simulate the provisioning
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(), 1000); // Simulate API delay
      });
    }

    try {
      await axios.post(
        `${API_BASE_URL}/projects/${id}/provision`,
        { recommendations },
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async getProjectResources(id: number): Promise<AzureResource[]> {
    // Return mock resources for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(
          () =>
            resolve([
              {
                id: 1,
                name: "web-app-eastus",
                resourceType: "App Service",
                status: "Active" as
                  | "Provisioning"
                  | "Active"
                  | "Error"
                  | "Deleted",
                location: "East US",
                estimatedMonthlyCost: 73.2,
                configuration: { tier: "Standard", instances: 1 },
                createdAt: new Date().toISOString(),
                provisionedAt: new Date().toISOString(),
              },
              {
                id: 2,
                name: "sql-db-eastus",
                resourceType: "Azure SQL Database",
                status: "Active" as
                  | "Provisioning"
                  | "Active"
                  | "Error"
                  | "Deleted",
                location: "East US",
                estimatedMonthlyCost: 30.0,
                configuration: { tier: "S2", size: "100GB" },
                createdAt: new Date().toISOString(),
                provisionedAt: new Date().toISOString(),
              },
            ]),
          300
        );
      });
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/projects/${id}/resources`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }
}

export const projectsService = new ProjectsService();
