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
              projectId: 8,
              projectName: "Dating app for turtles",
              amount: 450.25,
              percentage: 65.2,
              trend: "up",
              change: "+12%",
              resourceCount: 4,
              resources: [
                {
                  resourceId: 67,
                  resourceName: "turtleappstorage",
                  resourceType: "Storage Account",
                  amount: 180.50,
                  percentage: 40.1,
                  status: "Active"
                },
                {
                  resourceId: 68,
                  resourceName: "turtle-webapp",
                  resourceType: "App Service",
                  amount: 150.75,
                  percentage: 33.5,
                  status: "Active"
                }
              ],
              status: "Active",
              createdAt: new Date().toISOString()
            },
            {
              projectId: 9,
              projectName: "E-commerce Platform",
              amount: 240.80,
              percentage: 34.8,
              trend: "down",
              change: "-5%",
              resourceCount: 3,
              resources: [
                {
                  resourceId: 70,
                  resourceName: "ecommerce-db",
                  resourceType: "SQL Database",
                  amount: 120.40,
                  percentage: 50.0,
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