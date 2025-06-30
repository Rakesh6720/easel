import axios from "axios";
import { isTestUser } from "./test-user";
import {
  mockAzureCredentials,
  mockResourceMetrics,
} from "./mock-data-enhanced";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export interface AzureCredential {
  id: number;
  subscriptionId: string;
  subscriptionName: string;
  displayName: string;
  isDefault: boolean;
  isActive: boolean;
  lastValidated: string;
  createdAt: string;
}

export interface AddAzureCredentialsRequest {
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  displayName: string;
}

export interface ValidationResponse {
  isValid: boolean;
  lastValidated: string;
}

export interface AzureRoleCheckResult {
  hasContributorRole: boolean;
  isValid: boolean;
  message: string;
  assignedRoles: string[];
  errorMessage?: string;
}

export interface CreateServicePrincipalRequest {
  subscriptionId: string;
  displayName: string;
  accessToken: string;
  autoAssignContributorRole?: boolean;
}

export interface ServicePrincipalCreationResult {
  success: boolean;
  servicePrincipalId?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  subscriptionId?: string;
  displayName?: string;
  contributorRoleAssigned: boolean;
  errorMessage?: string;
  warnings: string[];
}

export interface RoleAssignmentResult {
  success: boolean;
  roleAlreadyAssigned?: boolean;
  errorMessage?: string;
  message?: string;
}

class AzureService {
  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getCredentials(): Promise<AzureCredential[]> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockAzureCredentials), 300);
      });
    }

    const response = await axios.get(`${API_BASE_URL}/azure/credentials`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async addCredentials(
    data: AddAzureCredentialsRequest
  ): Promise<AzureCredential> {
    // Simulate adding credentials for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newCredential: AzureCredential = {
            id: Date.now(),
            subscriptionId: data.subscriptionId,
            subscriptionName: `Demo ${data.displayName}`,
            displayName: data.displayName,
            isDefault: false,
            isActive: true,
            lastValidated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          resolve(newCredential);
        }, 1000);
      });
    }

    const response = await axios.post(
      `${API_BASE_URL}/azure/credentials`,
      data,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async validateCredentials(credentialId: number): Promise<ValidationResponse> {
    // Simulate validation for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            isValid: true,
            lastValidated: new Date().toISOString(),
          });
        }, 800);
      });
    }

    const response = await axios.post(
      `${API_BASE_URL}/azure/credentials/${credentialId}/validate`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async setDefaultCredential(credentialId: number): Promise<void> {
    await axios.patch(
      `${API_BASE_URL}/azure/credentials/${credentialId}/set-default`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  async deleteCredential(
    credentialId: number,
    confirmed: boolean = false
  ): Promise<any> {
    const response = await axios.delete(
      `${API_BASE_URL}/azure/credentials/${credentialId}?confirmed=${confirmed}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async getAvailableLocations(credentialId: number): Promise<string[]> {
    const response = await axios.get(
      `${API_BASE_URL}/azure/credentials/${credentialId}/locations`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async getResourceMetrics(
    resourceId: number,
    startTime?: string,
    endTime?: string
  ): Promise<any[]> {
    // Return mock metrics for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const metrics = mockResourceMetrics.filter(
            (m) => m.resourceId === resourceId
          );
          resolve(metrics);
        }, 400);
      });
    }

    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);

    const response = await axios.get(
      `${API_BASE_URL}/azure/resources/${resourceId}/metrics?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async getResourceUsage(resourceId: number): Promise<Record<string, any>> {
    const response = await axios.get(
      `${API_BASE_URL}/azure/resources/${resourceId}/usage`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async getProjectCost(
    projectId: number
  ): Promise<{ currentMonthlyCost: number }> {
    const response = await axios.get(
      `${API_BASE_URL}/azure/projects/${projectId}/cost`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async updateMetrics(): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/azure/metrics/update`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  async checkSubscriptionRole(
    credentialId: number
  ): Promise<AzureRoleCheckResult> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            isValid: true,
            hasContributorRole: true,
            message:
              "Mock service principal has Contributor role on the subscription",
            assignedRoles: ["b24988ac-6180-42a0-ab88-20f7382dd24c"],
            errorMessage: undefined,
          });
        }, 500);
      });
    }

    const response = await axios.get(
      `${API_BASE_URL}/azure/credentials/${credentialId}/role-check`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async createServicePrincipal(
    request: CreateServicePrincipalRequest
  ): Promise<ServicePrincipalCreationResult> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            servicePrincipalId: "mock-sp-id",
            clientId: "mock-client-id",
            clientSecret: "mock-client-secret",
            tenantId: "mock-tenant-id",
            subscriptionId: request.subscriptionId,
            displayName: request.displayName,
            contributorRoleAssigned: true,
            warnings: [],
          });
        }, 2000);
      });
    }

    const response = await axios.post(
      `${API_BASE_URL}/azure/service-principal/create`,
      request,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async validateAzureToken(accessToken: string): Promise<{ isValid: boolean }> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ isValid: true }), 500);
      });
    }

    const response = await axios.post(
      `${API_BASE_URL}/azure/token/validate`,
      { accessToken },
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async assignContributorRoleToCredential(
    credentialId: number,
    accessToken: string
  ): Promise<RoleAssignmentResult> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: "Mock Contributor role assignment completed successfully",
          });
        }, 1500);
      });
    }

    const response = await axios.post(
      `${API_BASE_URL}/azure/credentials/${credentialId}/assign-contributor-role`,
      { accessToken },
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  async elevateServicePrincipalPermissions(
    credentialId: number,
    accessToken: string
  ): Promise<RoleAssignmentResult> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message:
              "Mock permission elevation completed successfully. Service principal now has User Access Administrator and Contributor roles.",
          });
        }, 1500);
      });
    }

    const response = await axios.post(
      `${API_BASE_URL}/azure/credentials/${credentialId}/elevate-permissions`,
      { accessToken },
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }
}

export const azureService = new AzureService();
