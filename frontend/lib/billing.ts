import axios from "axios";
import { isTestUser } from "./test-user";
import {
  currentBill,
  billingHistory,
  costBreakdown,
  paymentMethod,
  calculateThreeMonthAverage,
  calculateMonthOverMonthChange,
  getBudgetUtilization,
  getCostOptimizationSavings,
  type CurrentBill,
  type BillingPeriod,
  type CostBreakdownItem,
  type PaymentMethod,
} from "./mock-billing-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export interface BillingData {
  currentBill: CurrentBill;
  billingHistory: BillingPeriod[];
  costBreakdown: CostBreakdownItem[];
  paymentMethod: PaymentMethod;
  threeMonthAverage: number;
  monthOverMonthChange: number;
  budgetInfo: {
    budget: number;
    currentSpend: number;
    percentage: number;
    alertLevel: string;
  };
  optimizationRecommendations: CostOptimizationRecommendation[];
}

export interface CostOptimizationRecommendation {
  type: string;
  description: string;
  estimatedMonthlySavings: number;
  severity: string;
  affectedResources: string[];
}

export interface ProjectCostBreakdownItem {
  projectId: number;
  projectName: string;
  amount: number;
  percentage: number;
  trend: string;
  change: string;
  resourceCount: number;
  resources: ResourceCostItem[];
  status: string;
  createdAt: string;
}

export interface ResourceCostItem {
  resourceId: number;
  resourceName: string;
  resourceType: string;
  amount: number;
  percentage: number;
  status: string;
}

class BillingService {
  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getBillingData(): Promise<BillingData> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            currentBill,
            billingHistory,
            costBreakdown,
            paymentMethod,
            threeMonthAverage: calculateThreeMonthAverage(),
            monthOverMonthChange: calculateMonthOverMonthChange(),
            budgetInfo: getBudgetUtilization(),
            optimizationRecommendations: [
              {
                type: "Idle Resources",
                description: "Consider scaling down or deleting underutilized resources",
                estimatedMonthlySavings: getCostOptimizationSavings().savings || 0,
                severity: "medium",
                affectedResources: ["demo-storage", "demo-database"]
              }
            ],
          });
        }, 500);
      });
    }

    // Fetch real data for authenticated users
    const response = await axios.get(`${API_BASE_URL}/billing/data`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getBillingHistory(limit?: number): Promise<BillingPeriod[]> {
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(limit ? billingHistory.slice(0, limit) : billingHistory);
        }, 300);
      });
    }

    const params = limit ? `?limit=${limit}` : "";
    const response = await axios.get(`${API_BASE_URL}/billing/history${params}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getCostBreakdown(
    startDate?: string,
    endDate?: string
  ): Promise<CostBreakdownItem[]> {
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(costBreakdown), 300);
      });
    }

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await axios.get(
      `${API_BASE_URL}/billing/cost-breakdown?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async getProjectCostBreakdown(
    startDate?: string,
    endDate?: string
  ): Promise<ProjectCostBreakdownItem[]> {
    console.log("getProjectCostBreakdown called, isTestUser:", isTestUser());
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Generate mock project breakdown data
          const mockProjects = [
            {
              projectId: 101,
              projectName: "Demo Web Application",
              amount: 325.50,
              percentage: 58.3,
              trend: "up",
              change: "+8%",
              resourceCount: 5,
              resources: [
                {
                  resourceId: 201,
                  resourceName: "demo-webapp-storage",
                  resourceType: "Storage Account",
                  amount: 145.20,
                  percentage: 44.6,
                  status: "Active"
                },
                {
                  resourceId: 202,
                  resourceName: "demo-app-service",
                  resourceType: "App Service",
                  amount: 98.30,
                  percentage: 30.2,
                  status: "Active"
                },
                {
                  resourceId: 203,
                  resourceName: "demo-sql-database",
                  resourceType: "SQL Database",
                  amount: 82.00,
                  percentage: 25.2,
                  status: "Active"
                }
              ],
              status: "Active",
              createdAt: new Date().toISOString()
            },
            {
              projectId: 102,
              projectName: "Analytics Dashboard",
              amount: 185.75,
              percentage: 33.3,
              trend: "up",
              change: "+15%",
              resourceCount: 3,
              resources: [
                {
                  resourceId: 204,
                  resourceName: "analytics-data-lake",
                  resourceType: "Storage Account",
                  amount: 95.40,
                  percentage: 51.4,
                  status: "Active"
                },
                {
                  resourceId: 205,
                  resourceName: "analytics-insights",
                  resourceType: "Application Insights",
                  amount: 55.35,
                  percentage: 29.8,
                  status: "Active"
                },
                {
                  resourceId: 206,
                  resourceName: "analytics-redis",
                  resourceType: "Redis Cache",
                  amount: 35.00,
                  percentage: 18.8,
                  status: "Active"
                }
              ],
              status: "Active",
              createdAt: new Date().toISOString()
            },
            {
              projectId: 103,
              projectName: "Mobile API Backend",
              amount: 46.90,
              percentage: 8.4,
              trend: "down",
              change: "-3%",
              resourceCount: 2,
              resources: [
                {
                  resourceId: 207,
                  resourceName: "mobile-api-service",
                  resourceType: "App Service",
                  amount: 28.50,
                  percentage: 60.8,
                  status: "Active"
                },
                {
                  resourceId: 208,
                  resourceName: "mobile-api-storage",
                  resourceType: "Storage Account",
                  amount: 18.40,
                  percentage: 39.2,
                  status: "Active"
                }
              ],
              status: "Active",
              createdAt: new Date().toISOString()
            }
          ];
          resolve(mockProjects);
        }, 400);
      });
    }

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await axios.get(
      `${API_BASE_URL}/billing/project-cost-breakdown?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async getCurrentMonthCost(): Promise<{ currentMonthlyCost: number }> {
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ currentMonthlyCost: currentBill.amount }), 300);
      });
    }

    const response = await axios.get(`${API_BASE_URL}/billing/current-month-cost`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getBudgetInfo(): Promise<{
    budget: number;
    currentSpend: number;
    percentage: number;
    alertLevel: string;
  }> {
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(getBudgetUtilization()), 300);
      });
    }

    const response = await axios.get(`${API_BASE_URL}/billing/budget`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getOptimizationRecommendations(): Promise<CostOptimizationRecommendation[]> {
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockRecommendations = [
            {
              type: "Idle Resources",
              description: "Consider scaling down or deleting underutilized resources",
              estimatedMonthlySavings: getCostOptimizationSavings().savings || 0,
              severity: "medium",
              affectedResources: ["demo-storage", "demo-database"]
            }
          ];
          resolve(mockRecommendations);
        }, 300);
      });
    }

    const response = await axios.get(
      `${API_BASE_URL}/billing/optimization-recommendations`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }
}

export const billingService = new BillingService();