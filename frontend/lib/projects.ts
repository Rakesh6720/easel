import axios from 'axios'
import { isTestUser } from './test-user'
import { mockProjectsEnhanced, searchMockProjects } from './mock-data-enhanced'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

export interface Project {
  id: number
  name: string
  description: string
  userRequirements: string
  processedRequirements: string
  status: 'Draft' | 'Analyzing' | 'ResourcesIdentified' | 'Provisioning' | 'Active' | 'Error' | 'Archived'
  createdAt: string
  updatedAt: string
  userId: number
  userAzureCredentialId?: number
  resources: AzureResource[]
  conversations: ProjectConversation[]
}

export interface AzureResource {
  id: number
  name: string
  resourceType: string
  status: 'Provisioning' | 'Active' | 'Error' | 'Deleted'
  location: string
  estimatedMonthlyCost: number
  configuration: Record<string, any>
  createdAt: string
  provisionedAt?: string
  deletedAt?: string
}

export interface ProjectConversation {
  id: number
  projectId: number
  userMessage: string
  aiResponse: string
  createdAt: string
}

export interface CreateProjectRequest {
  name: string
  userRequirements: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
}

class ProjectsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async getProjects(): Promise<Project[]> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockProjectsEnhanced), 300) // Simulate API delay
      })
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async getProject(id: number): Promise<Project> {
    // Return mock data for test user
    if (isTestUser()) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const project = mockProjectsEnhanced.find(p => p.id === id)
          if (project) {
            resolve(project)
          } else {
            reject(new Error('Project not found'))
          }
        }, 200)
      })
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async createProject(request: CreateProjectRequest): Promise<Project> {
    // Simulate project creation for test user
    if (isTestUser()) {
      return new Promise(resolve => {
        setTimeout(() => {
          const newProject: Project = {
            id: Date.now(), // Simple ID generation
            name: request.name,
            description: 'AI-generated project description based on requirements',
            userRequirements: request.userRequirements,
            processedRequirements: `Processed requirements for: ${request.userRequirements}`,
            status: 'Analyzing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 999999,
            resources: [],
            conversations: []
          }
          resolve(newProject)
        }, 1500) // Simulate longer processing time
      })
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/projects`, request, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async updateProject(id: number, request: UpdateProjectRequest): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/projects/${id}`, request, {
        headers: this.getAuthHeaders()
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async deleteProject(id: number, confirmed: boolean = false): Promise<any> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/projects/${id}?confirmed=${confirmed}`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async getProjectConversations(id: number): Promise<ProjectConversation[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${id}/conversations`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async addConversation(id: number, message: string): Promise<{ response: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/${id}/conversation`, 
        { message }, 
        { headers: this.getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async generateRecommendations(id: number): Promise<any[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/${id}/generate-recommendations`, {}, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async provisionResources(id: number, recommendations: any[]): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/projects/${id}/provision`, 
        { recommendations }, 
        { headers: this.getAuthHeaders() }
      )
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }

  async getProjectResources(id: number): Promise<AzureResource[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${id}/resources`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw error
    }
  }
}

export const projectsService = new ProjectsService()