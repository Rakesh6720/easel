import axios from "axios";
import { isTestUser } from "./test-user";
import { mockProjectsEnhanced, searchMockProjects } from "./mock-data-enhanced";
import { projectResourceMapping, allMockResourcesData } from "./mock-resource-data";

// In-memory storage for test user created projects
const testUserProjects = new Map<number, Project>();

// Cache for real user resources to prevent loss during navigation
const realUserResourceCache = new Map<number, AzureResource[]>();

function generateContextualMockResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  if (message.includes('storage') && (message.includes('sql') || message.includes('database'))) {
    return `Great question! For most web applications, you'll typically need multiple storage solutions:

**Beyond SQL Database:**
- **Azure Storage Account** - For file uploads, images, documents
- **Azure Redis Cache** - For session data and caching
- **Azure CDN** - For static assets and improved performance

**When to use each:**
- SQL Database: Structured data, user accounts, transactions
- Blob Storage: Files, images, videos, backups
- Redis: Temporary data, sessions, real-time features

For your project, I'd recommend starting with SQL Database + Storage Account, then adding Redis if you need caching.`;
  }
  
  if (message.includes('cost') || message.includes('pricing') || message.includes('budget')) {
    return `Here's a cost breakdown for typical Azure resources:

**Monthly Estimates:**
- App Service (Basic): $13-55/month
- SQL Database (Basic): $5-15/month  
- Storage Account: $1-10/month
- Application Insights: Free tier available

**Total for small project:** $20-80/month
**Tips to save costs:**
- Start with Basic tiers
- Use auto-scaling to avoid over-provisioning
- Monitor usage with cost alerts`;
  }
  
  if (message.includes('scale') || message.includes('performance') || message.includes('users')) {
    return `For scaling your application:

**Small Scale (100s users):**
- Basic App Service + Basic SQL Database
- Estimated: $20-50/month

**Medium Scale (1000s users):**
- Standard App Service + Standard SQL
- Add Redis Cache for performance
- Estimated: $100-300/month

**Large Scale (10k+ users):**
- Premium tiers + Auto-scaling
- CDN for global performance
- Estimated: $500+/month

What's your expected user volume?`;
  }
  
  if (message.includes('security') || message.includes('auth') || message.includes('login')) {
    return `For authentication and security:

**Azure Security Services:**
- **Azure Active Directory B2C** - User identity management
- **Key Vault** - Secure secrets and certificates
- **Application Gateway** - Web application firewall

**Best Practices:**
- Enable HTTPS everywhere
- Use managed identities for service connections
- Implement proper RBAC (Role-Based Access Control)
- Regular security audits

Would you like specific guidance on any of these security aspects?`;
  }
  
  // Default helpful response
  return `I'd be happy to help with that! For your project, here are some things to consider:

**Common Questions I Can Help With:**
- Azure resource recommendations
- Cost optimization strategies
- Scaling and performance planning
- Security best practices
- Architecture design decisions

What specific aspect would you like to dive deeper into?`;
}

function generateResourcesForProject(project: Project): AzureResource[] {
  const baseId = project.id;
  const projectName = project.name.toLowerCase().replace(/\s+/g, '-');
  
  // Generate resources based on project requirements
  const resources: AzureResource[] = [];
  
  // Always include core resources
  resources.push({
    id: baseId * 10 + 1,
    name: `${projectName}-app`,
    resourceType: "App Service",
    status: "Active",
    location: "East US",
    estimatedMonthlyCost: 75.0,
    configuration: { tier: "Standard", instances: 1 },
    createdAt: project.createdAt,
    provisionedAt: project.createdAt,
  });
  
  resources.push({
    id: baseId * 10 + 2,
    name: `${projectName}-db`,
    resourceType: "Azure SQL Database",
    status: "Active", 
    location: "East US",
    estimatedMonthlyCost: 25.0,
    configuration: { tier: "Basic", storage: "10GB" },
    createdAt: project.createdAt,
    provisionedAt: project.createdAt,
  });
  
  resources.push({
    id: baseId * 10 + 3,
    name: `${projectName}-storage`,
    resourceType: "Storage Account",
    status: "Active",
    location: "East US", 
    estimatedMonthlyCost: 5.0,
    configuration: { type: "Standard_LRS", tier: "Hot" },
    createdAt: project.createdAt,
    provisionedAt: project.createdAt,
  });
  
  // Add additional resources based on requirements
  if (project.userRequirements.toLowerCase().includes('api')) {
    resources.push({
      id: baseId * 10 + 4,
      name: `${projectName}-apim`,
      resourceType: "API Management",
      status: "Active",
      location: "East US",
      estimatedMonthlyCost: 40.0,
      configuration: { tier: "Developer" },
      createdAt: project.createdAt,
      provisionedAt: project.createdAt,
    });
  }
  
  if (project.userRequirements.toLowerCase().includes('cache') || project.userRequirements.toLowerCase().includes('redis')) {
    resources.push({
      id: baseId * 10 + 5,
      name: `${projectName}-cache`,
      resourceType: "Redis Cache",
      status: "Active",
      location: "East US",
      estimatedMonthlyCost: 15.0,
      configuration: { tier: "Basic", size: "C0" },
      createdAt: project.createdAt,
      provisionedAt: project.createdAt,
    });
  }
  
  return resources;
}

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

export interface AzureRoleCheckResult {
  hasContributorRole: boolean;
  isValid: boolean;
  message: string;
  assignedRoles: string[];
  errorMessage?: string;
}

export interface CreateProjectRequest {
  name: string;
  userRequirements: string;
  azureCredentialId?: number | null;
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
        setTimeout(() => {
          // Start with static mock projects
          const allProjects = [...mockProjectsEnhanced];

          // Add dynamically created projects from localStorage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("test_project_")) {
              try {
                const projectData = localStorage.getItem(key);
                if (projectData) {
                  const project = JSON.parse(projectData);
                  // Ensure it's not already in the static list
                  if (!allProjects.find((p) => p.id === project.id)) {
                    allProjects.push(project);
                    // Also restore to memory
                    testUserProjects.set(project.id, project);
                  }
                }
              } catch (e) {
                console.warn(
                  "Error loading project from localStorage:",
                  key,
                  e
                );
              }
            }
          }

          // Sort by most recent first
          allProjects.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          resolve(allProjects);
        }, 300); // Simulate API delay
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
          // First check in-memory storage for dynamically created projects
          let dynamicProject = testUserProjects.get(id);
          if (dynamicProject) {
            resolve(dynamicProject);
            return;
          }

          // Check localStorage for persistence across page reloads
          try {
            const storedProject = localStorage.getItem(`test_project_${id}`);
            if (storedProject) {
              const parsedProject = JSON.parse(storedProject);
              testUserProjects.set(id, parsedProject); // Restore to memory
              resolve(parsedProject);
              return;
            }
          } catch (e) {
            console.warn("Error reading from localStorage:", e);
          }

          // Then check static mock data
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

          // Store the project in memory and localStorage for test users
          testUserProjects.set(newProject.id, newProject);
          try {
            localStorage.setItem(
              `test_project_${newProject.id}`,
              JSON.stringify(newProject)
            );
          } catch (e) {
            console.warn("Could not save to localStorage:", e);
          }
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
    // Handle test user project updates
    if (isTestUser()) {
      return new Promise((resolve, reject) => {
        try {
          // Get the project from memory or localStorage
          let project = testUserProjects.get(id);
          
          if (!project) {
            const storedProject = localStorage.getItem(`test_project_${id}`);
            if (storedProject) {
              project = JSON.parse(storedProject);
              testUserProjects.set(id, project!);
            }
          }
          
          // Check if it's a static mock project - these can't be edited
          const staticProject = mockProjectsEnhanced.find(p => p.id === id);
          if (staticProject && !project) {
            reject(new Error("Cannot edit demo projects. This is a read-only demo project."));
            return;
          }
          
          if (project) {
            // Update the project
            project.name = request.name || project.name;
            project.description = request.description || project.description;
            project.userRequirements = request.userRequirements || project.userRequirements;
            project.updatedAt = new Date().toISOString();
            
            // Save back to memory and localStorage
            testUserProjects.set(id, project);
            localStorage.setItem(`test_project_${id}`, JSON.stringify(project));
            
            resolve();
          } else {
            reject(new Error("Project not found"));
          }
        } catch (error) {
          reject(error);
        }
      });
    }

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
    // Handle test user project deletion
    if (isTestUser()) {
      return new Promise((resolve, reject) => {
        try {
          // First call: return confirmation details
          if (!confirmed) {
            // Find the project to get details
            let projectToDelete = testUserProjects.get(id);
            
            // If not in memory, check localStorage
            if (!projectToDelete) {
              const storedProject = localStorage.getItem(`test_project_${id}`);
              if (storedProject) {
                projectToDelete = JSON.parse(storedProject);
              }
            }
            
            // Check if it's a static mock project
            if (!projectToDelete) {
              const staticProject = mockProjectsEnhanced.find(p => p.id === id);
              if (staticProject) {
                resolve({
                  confirmed: false,
                  projectName: staticProject.name,
                  resourceCount: staticProject.resources?.length || 0,
                  resources: staticProject.resources || [],
                  estimatedMonthlyCost: staticProject.resources?.reduce((sum, r) => sum + (r.estimatedMonthlyCost || 0), 0) || 0,
                  message: "This is a demo project. Deletion will only affect your local session."
                });
                return;
              }
            }
            
            if (projectToDelete) {
              resolve({
                confirmed: false,
                projectName: projectToDelete.name,
                resourceCount: projectToDelete.resources?.length || 0,
                resources: projectToDelete.resources || [],
                estimatedMonthlyCost: projectToDelete.resources?.reduce((sum, r) => sum + (r.estimatedMonthlyCost || 0), 0) || 0,
                message: "This project will be removed from your local session."
              });
            } else {
              reject(new Error("Project not found"));
            }
          } else {
            // Second call: perform actual deletion
            // Remove from memory
            testUserProjects.delete(id);
            
            // Remove from localStorage
            localStorage.removeItem(`test_project_${id}`);
            
            resolve({
              confirmed: true,
              message: "Project deleted successfully"
            });
          }
        } catch (error) {
          reject(error);
        }
      });
    }

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
    // Return mock conversations for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Check if this is a dynamic project with its own conversations
          let dynamicProject = testUserProjects.get(id);

          // If not in memory, check localStorage
          if (!dynamicProject) {
            try {
              const storedProject = localStorage.getItem(`test_project_${id}`);
              if (storedProject) {
                const parsedProject = JSON.parse(storedProject);
                dynamicProject = parsedProject;
                testUserProjects.set(id, parsedProject);
              }
            } catch (e) {
              console.warn("Error reading project from localStorage:", e);
            }
          }

          // If we found a dynamic project, return its conversations
          if (dynamicProject && dynamicProject.conversations) {
            resolve(dynamicProject.conversations);
            return;
          }

          // Otherwise return empty array for new projects
          resolve([]);
        }, 100);
      });
    }

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
    // Handle test user conversations
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Generate a mock AI response based on the user's question
          const mockResponse = generateContextualMockResponse(message);

          // Get the project and add the conversation
          let project = testUserProjects.get(id);

          // If not in memory, try to load from localStorage
          if (!project) {
            try {
              const storedProject = localStorage.getItem(`test_project_${id}`);
              if (storedProject) {
                project = JSON.parse(storedProject);
                testUserProjects.set(id, project!);
              }
            } catch (e) {
              console.warn("Error loading project for conversation:", e);
            }
          }

          // Add the conversation to the project
          if (project) {
            const newConversation: ProjectConversation = {
              id: Date.now(),
              projectId: id,
              userMessage: message,
              aiResponse: mockResponse,
              createdAt: new Date().toISOString(),
            };

            if (!project.conversations) {
              project.conversations = [];
            }
            project.conversations.push(newConversation);

            // Update in memory and localStorage
            testUserProjects.set(id, project);
            try {
              localStorage.setItem(
                `test_project_${id}`,
                JSON.stringify(project)
              );
            } catch (e) {
              console.warn("Could not save conversation to localStorage:", e);
            }
          }

          resolve({ response: mockResponse });
        }, 1000); // Simulate API delay
      });
    }

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
    // For test user, simulate provisioning and add resources to the project
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const project = testUserProjects.get(id);
          if (project) {
            // Convert recommendations to resources
            const newResources: AzureResource[] = recommendations.map(
              (rec, index) => ({
                id: Date.now() + index,
                name: rec.name || `Resource ${index + 1}`,
                resourceType:
                  rec.service || rec.resourceType || rec.type || "Unknown",
                status: "Provisioning" as const,
                location: rec.location || "East US",
                estimatedMonthlyCost: rec.estimatedCost || rec.cost || 0,
                configuration: rec.configuration || {},
                createdAt: new Date().toISOString(),
                provisionedAt: new Date().toISOString(),
              })
            );

            // Update the project with new resources
            project.resources = newResources;
            project.status = "Active";
            project.updatedAt = new Date().toISOString();
            testUserProjects.set(id, project);

            // Persist to localStorage
            try {
              localStorage.setItem(
                `test_project_${id}`,
                JSON.stringify(project)
              );
            } catch (e) {
              console.warn(
                "Could not save updated project to localStorage:",
                e
              );
            }
          }
          resolve();
        }, 1000); // Simulate API delay
      });
    }

    try {
      console.log("Sending provision request:", {
        url: `${API_BASE_URL}/projects/${id}/provision`,
        data: { recommendations },
        headers: this.getAuthHeaders(),
      });

      // Log the exact structure being sent
      console.log(
        "Recommendations structure:",
        JSON.stringify(recommendations, null, 2)
      );

      await axios.post(
        `${API_BASE_URL}/projects/${id}/provision`,
        { recommendations },
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      console.error("Provision error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
        console.error("Response headers:", error.response?.headers);

        if (error.response?.status === 401) {
          window.location.href = "/login";
          throw new Error("Authentication required");
        }
      }
      throw error;
    }
  }

  async getProjectResources(id: number): Promise<AzureResource[]> {
    // Return mock resources for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Check if this is a dynamic project with its own resources
          let dynamicProject = testUserProjects.get(id);

          // If not in memory, check localStorage
          if (!dynamicProject) {
            try {
              const storedProject = localStorage.getItem(`test_project_${id}`);
              if (storedProject) {
                const parsedProject = JSON.parse(storedProject);
                dynamicProject = parsedProject;
                testUserProjects.set(id, parsedProject);
              }
            } catch (e) {
              console.warn("Error reading project from localStorage:", e);
            }
          }

          // If we found a dynamic project, return its resources
          if (dynamicProject && dynamicProject.resources) {
            resolve(dynamicProject.resources);
            return;
          }

          // If this is a dynamic project without resources, generate some based on the project
          if (dynamicProject && !dynamicProject.resources) {
            console.log(`Generating resources for dynamic project ${id}: ${dynamicProject.name}`);
            const generatedResources = generateResourcesForProject(dynamicProject);
            
            // Store the resources back to the project
            dynamicProject.resources = generatedResources;
            testUserProjects.set(id, dynamicProject);
            localStorage.setItem(`test_project_${id}`, JSON.stringify(dynamicProject));
            
            resolve(generatedResources);
            return;
          }

          // Check if this matches any static project by using the resource mapping
          const resourceIds = projectResourceMapping[id] || [];
          if (resourceIds.length > 0) {
            const projectResources = resourceIds
              .map((resourceId) => allMockResourcesData[resourceId])
              .filter((resource) => resource !== undefined)
              .map((resource) => ({
                id: resource.id,
                name: resource.name,
                resourceType: resource.type,
                status: resource.status as any,
                location: resource.region,
                estimatedMonthlyCost: resource.cost,
                configuration: resource.configuration,
                createdAt: resource.createdAt,
                provisionedAt: resource.createdAt,
              }));
            resolve(projectResources);
            return;
          }

          // Final fallback: return empty resources for unknown projects
          console.warn(`Project ${id} not found, returning empty resources`);
          resolve([]);
        }, 300);
      });
    }

    // Check cache first for real users to prevent data loss during navigation
    if (realUserResourceCache.has(id)) {
      return realUserResourceCache.get(id)!;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/projects/${id}/resources`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      
      // Cache the result to prevent loss during navigation
      realUserResourceCache.set(id, response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async retryResource(projectId: number, resourceId: number): Promise<void> {
    // For test user, simulate retrying the resource
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const project = testUserProjects.get(projectId);
          if (project) {
            // Find the resource and update its status
            const resourceIndex = project.resources.findIndex(
              (r) => r.id === resourceId
            );
            if (resourceIndex !== -1) {
              project.resources[resourceIndex] = {
                ...project.resources[resourceIndex],
                status: "Provisioning" as const,
                provisionedAt: new Date().toISOString(),
              };

              // Simulate some will succeed, some might fail again
              setTimeout(() => {
                const updatedProject = testUserProjects.get(projectId);
                if (updatedProject) {
                  const updatedResourceIndex =
                    updatedProject.resources.findIndex(
                      (r) => r.id === resourceId
                    );
                  if (updatedResourceIndex !== -1) {
                    // 80% chance of success on retry
                    const success = Math.random() > 0.2;
                    updatedProject.resources[updatedResourceIndex] = {
                      ...updatedProject.resources[updatedResourceIndex],
                      status: success
                        ? ("Active" as const)
                        : ("Error" as const),
                    };
                    testUserProjects.set(projectId, updatedProject);

                    // Persist to localStorage
                    try {
                      localStorage.setItem(
                        `test_project_${projectId}`,
                        JSON.stringify(updatedProject)
                      );
                    } catch (e) {
                      console.warn(
                        "Could not save updated project to localStorage:",
                        e
                      );
                    }
                  }
                }
              }, 2000); // Simulate retry process taking 2 seconds

              testUserProjects.set(projectId, project);

              // Persist to localStorage
              try {
                localStorage.setItem(
                  `test_project_${projectId}`,
                  JSON.stringify(project)
                );
              } catch (e) {
                console.warn(
                  "Could not save updated project to localStorage:",
                  e
                );
              }
            }
          }
          resolve();
        }, 500); // Short delay to show loading state
      });
    }

    // For real users, call the dedicated retry endpoint
    try {
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/resources/${resourceId}/retry`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log("✅ Retry request completed successfully");
    } catch (error) {
      console.error("Retry resource error:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async retryAllFailedResources(projectId: number): Promise<void> {
    // For test user, simulate retrying all failed resources
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const project = testUserProjects.get(projectId);
          if (project) {
            // Find all failed resources and update their status
            project.resources = project.resources.map((resource) => {
              if (resource.status === "Error") {
                return {
                  ...resource,
                  status: "Provisioning" as const,
                  provisionedAt: new Date().toISOString(),
                };
              }
              return resource;
            });

            // Simulate retry process
            setTimeout(() => {
              const updatedProject = testUserProjects.get(projectId);
              if (updatedProject) {
                updatedProject.resources = updatedProject.resources.map(
                  (resource) => {
                    if (resource.status === "Provisioning") {
                      // 80% chance of success on retry
                      const success = Math.random() > 0.2;
                      return {
                        ...resource,
                        status: success
                          ? ("Active" as const)
                          : ("Error" as const),
                      };
                    }
                    return resource;
                  }
                );
                testUserProjects.set(projectId, updatedProject);

                // Persist to localStorage
                try {
                  localStorage.setItem(
                    `test_project_${projectId}`,
                    JSON.stringify(updatedProject)
                  );
                } catch (e) {
                  console.warn(
                    "Could not save updated project to localStorage:",
                    e
                  );
                }
              }
            }, 3000); // Simulate retry process taking 3 seconds

            testUserProjects.set(projectId, project);

            // Persist to localStorage
            try {
              localStorage.setItem(
                `test_project_${projectId}`,
                JSON.stringify(project)
              );
            } catch (e) {
              console.warn(
                "Could not save updated project to localStorage:",
                e
              );
            }
          }
          resolve();
        }, 500); // Short delay to show loading state
      });
    }

    // For real users, get all failed resources and retry them
    try {
      const project = await this.getProject(projectId);
      const failedResources = project.resources.filter(
        (r) => r.status === "Error"
      );

      if (failedResources.length === 0) {
        return;
      }

      // Create recommendation objects from the failed resources
      const recommendations = failedResources.map((resource) => {
        // Parse configuration if it's a string (from database)
        let parsedConfiguration = resource.configuration;
        if (typeof resource.configuration === "string") {
          try {
            parsedConfiguration = JSON.parse(resource.configuration);
          } catch (e) {
            console.warn("Failed to parse configuration JSON:", e);
            parsedConfiguration = {};
          }
        }

        return {
          ResourceType: resource.resourceType,
          Name: resource.name,
          Location: resource.location,
          EstimatedMonthlyCost: resource.estimatedMonthlyCost,
          Configuration: parsedConfiguration,
          Reasoning: "Retry of failed resource",
        };
      });

      // Call the provision endpoint with all failed resources
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/provision`,
        { Recommendations: recommendations },
        { headers: this.getAuthHeaders() }
      );

      console.log(
        "✅ Retry all failed resources request completed successfully"
      );
    } catch (error) {
      console.error("Retry all failed resources error:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async checkAzureSubscriptionRole(
    credentialId: number
  ): Promise<AzureRoleCheckResult> {
    // For test user, return mock successful result
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            isValid: true,
            hasContributorRole: true,
            message:
              "Mock service principal has Contributor role on the subscription",
            assignedRoles: ["b24988ac-6180-42a0-ab88-20f7382dd24c"], // Contributor role ID
            errorMessage: undefined,
          });
        }, 300);
      });
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/azure/credentials/${credentialId}/role-check`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Check Azure role error:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }

  async assignAzureCredential(projectId: number, azureCredentialId: number): Promise<void> {
    try {
      await axios.patch(
        `${API_BASE_URL}/projects/${projectId}/azure-credential`,
        { AzureCredentialId: azureCredentialId },
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      console.error("Assign Azure credential error:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      throw error;
    }
  }
}

export const projectsService = new ProjectsService();
