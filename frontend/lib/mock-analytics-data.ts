// Analytics overview interface
export interface AnalyticsOverview {
  totalResources: number;
  activeProjects: number;
  monthlySpend: number;
  utilizationRate: number;
  growthRate: number;
  alertsActive: number;
}

// Resource utilization interface
export interface ResourceUtilization {
  category: string;
  totalResources: number;
  utilizationRate: number;
  trend: "up" | "down";
  change: string;
  cost: number;
}

// Project performance interface
export interface ProjectPerformance {
  id: number;
  name: string;
  resources: number;
  uptime: number;
  cost: number;
  efficiency: number;
  status: "healthy" | "warning" | "critical";
}

// Cost trend interface
export interface CostTrend {
  month: string;
  amount: number;
}

// Mock analytics overview data
export const mockAnalyticsOverview: AnalyticsOverview = {
  totalResources: 24,
  activeProjects: 8,
  monthlySpend: 3247.83,
  utilizationRate: 78.5,
  growthRate: 15.2,
  alertsActive: 3,
};

// Mock resource utilization data
export const mockResourceUtilization: ResourceUtilization[] = [
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

// Mock project performance data
export const mockProjectPerformance: ProjectPerformance[] = [
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

// Mock cost trends data
export const mockCostTrends: CostTrend[] = [
  { month: "Aug", amount: 2890.45 },
  { month: "Sep", amount: 3120.67 },
  { month: "Oct", amount: 2956.23 },
  { month: "Nov", amount: 3247.83 },
  { month: "Dec", amount: 3389.12 },
];

// Helper functions for analytics data
export const getTotalCostByCategory = () => {
  return mockResourceUtilization.reduce(
    (total, category) => total + category.cost,
    0
  );
};

export const getAverageUtilization = () => {
  const totalUtilization = mockResourceUtilization.reduce(
    (total, category) => total + category.utilizationRate,
    0
  );
  return totalUtilization / mockResourceUtilization.length;
};

export const getProjectsByStatus = (status: ProjectPerformance["status"]) => {
  return mockProjectPerformance.filter((project) => project.status === status);
};

export const getHighestCostCategory = () => {
  return mockResourceUtilization.reduce((highest, current) =>
    current.cost > highest.cost ? current : highest
  );
};

export const getLowestEfficiencyProject = () => {
  return mockProjectPerformance.reduce((lowest, current) =>
    current.efficiency < lowest.efficiency ? current : lowest
  );
};

export const getCostGrowthRate = () => {
  if (mockCostTrends.length < 2) return 0;
  const latest = mockCostTrends[mockCostTrends.length - 1].amount;
  const previous = mockCostTrends[mockCostTrends.length - 2].amount;
  return ((latest - previous) / previous) * 100;
};
