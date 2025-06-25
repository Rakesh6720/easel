// Mock project data and types
export interface Project {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Provisioning" | "Draft" | "Error";
  resourceCount: number;
  monthlyCost: number;
  createdAt: string;
  lastUpdated: string;
  requirements: string;
}

export const mockProjects: Project[] = [
  {
    id: 1,
    name: "E-commerce Platform",
    description: "Full-stack e-commerce solution with payment processing",
    status: "Active",
    resourceCount: 8,
    monthlyCost: 425.32,
    createdAt: "2024-01-15T10:30:00Z",
    lastUpdated: "2024-01-20T14:22:00Z",
    requirements:
      "Need a scalable e-commerce platform with user authentication, product catalog, shopping cart, and payment integration",
  },
  {
    id: 2,
    name: "API Gateway Service",
    description: "Centralized API management and routing",
    status: "Provisioning",
    resourceCount: 3,
    monthlyCost: 156.21,
    createdAt: "2024-01-18T09:15:00Z",
    lastUpdated: "2024-01-19T16:45:00Z",
    requirements:
      "API gateway to handle authentication, rate limiting, and routing for microservices",
  },
  {
    id: 3,
    name: "Data Analytics Pipeline",
    description: "Real-time data processing and analytics",
    status: "Active",
    resourceCount: 12,
    monthlyCost: 892.45,
    createdAt: "2024-01-10T11:00:00Z",
    lastUpdated: "2024-01-17T08:30:00Z",
    requirements:
      "Data pipeline for processing customer events, analytics, and generating business insights",
  },
  {
    id: 4,
    name: "Mobile App Backend",
    description: "Backend services for mobile application",
    status: "Draft",
    resourceCount: 0,
    monthlyCost: 0,
    createdAt: "2024-01-19T13:20:00Z",
    lastUpdated: "2024-01-19T13:20:00Z",
    requirements:
      "Backend API for mobile app with user management, push notifications, and data sync",
  },
  {
    id: 5,
    name: "IoT Sensor Network",
    description: "IoT device management and data collection",
    status: "Error",
    resourceCount: 2,
    monthlyCost: 78.5,
    createdAt: "2024-01-12T14:45:00Z",
    lastUpdated: "2024-01-16T10:15:00Z",
    requirements:
      "System to collect and process data from IoT sensors with real-time monitoring",
  },
];

// Helper functions for project data
export const getProjectById = (id: number): Project | undefined => {
  return mockProjects.find((project) => project.id === id);
};

export const getProjectsByStatus = (status: Project["status"]): Project[] => {
  return mockProjects.filter((project) => project.status === status);
};

export const searchProjects = (
  projects: Project[],
  searchTerm: string
): Project[] => {
  if (!searchTerm.trim()) {
    return projects;
  }

  const searchLower = searchTerm.toLowerCase();
  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.requirements.toLowerCase().includes(searchLower) ||
      project.status.toLowerCase().includes(searchLower)
  );
};

export const filterProjectsByStatus = (
  projects: Project[],
  statuses: Project["status"][]
): Project[] => {
  if (statuses.length === 0) {
    return projects;
  }
  return projects.filter((project) => statuses.includes(project.status));
};

export const getProjectStats = (projects: Project[]) => {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const totalCost = projects.reduce((sum, p) => sum + p.monthlyCost, 0);
  const totalResources = projects.reduce((sum, p) => sum + p.resourceCount, 0);

  return {
    totalProjects,
    activeProjects,
    totalCost,
    totalResources,
    averageCost: totalProjects > 0 ? totalCost / totalProjects : 0,
  };
};
