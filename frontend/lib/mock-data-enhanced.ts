// Enhanced mock data that matches the real API interfaces
import { Project, AzureResource, ProjectConversation } from './projects'
import { TEST_USER_ID } from './test-user'

// Mock Azure Resources
const mockResources: AzureResource[] = [
  {
    id: 1,
    name: 'ecommerce-app-service',
    resourceType: 'Microsoft.Web/sites',
    status: 'Active',
    location: 'East US',
    estimatedMonthlyCost: 75.50,
    configuration: {
      sku: 'Standard',
      tier: 'S1',
      capacity: 1
    },
    createdAt: '2024-01-15T10:30:00Z',
    provisionedAt: '2024-01-15T10:45:00Z'
  },
  {
    id: 2,
    name: 'ecommerce-sql-db',
    resourceType: 'Microsoft.Sql/databases',
    status: 'Active',
    location: 'East US',
    estimatedMonthlyCost: 120.00,
    configuration: {
      edition: 'Standard',
      serviceObjective: 'S1',
      maxSizeBytes: 268435456000
    },
    createdAt: '2024-01-15T10:30:00Z',
    provisionedAt: '2024-01-15T10:50:00Z'
  },
  {
    id: 3,
    name: 'ecommerce-storage',
    resourceType: 'Microsoft.Storage/storageAccounts',
    status: 'Active',
    location: 'East US',
    estimatedMonthlyCost: 25.30,
    configuration: {
      accountType: 'Standard_LRS',
      tier: 'Standard'
    },
    createdAt: '2024-01-15T10:30:00Z',
    provisionedAt: '2024-01-15T10:35:00Z'
  },
  {
    id: 4,
    name: 'api-gateway-service',
    resourceType: 'Microsoft.Web/sites',
    status: 'Active',
    location: 'West US 2',
    estimatedMonthlyCost: 45.20,
    configuration: {
      sku: 'Basic',
      tier: 'B1',
      capacity: 1
    },
    createdAt: '2024-01-20T14:00:00Z',
    provisionedAt: '2024-01-20T14:15:00Z'
  },
  {
    id: 5,
    name: 'blog-app-service',
    resourceType: 'Microsoft.Web/sites',
    status: 'Provisioning',
    location: 'Central US',
    estimatedMonthlyCost: 35.00,
    configuration: {
      sku: 'Free',
      tier: 'F1',
      capacity: 1
    },
    createdAt: '2024-01-25T09:00:00Z'
  }
]

// Mock Project Conversations
const mockConversations: ProjectConversation[] = [
  {
    id: 1,
    projectId: 1,
    userMessage: 'I need to add payment processing with Stripe integration',
    aiResponse: 'I can help you integrate Stripe payment processing. Based on your e-commerce platform, I recommend setting up Stripe checkout sessions with webhook handling for payment confirmations. This will require updating your backend API and adding the necessary environment variables for your Stripe keys.',
    createdAt: '2024-01-16T10:00:00Z'
  },
  {
    id: 2,
    projectId: 1,
    userMessage: 'How can I improve the performance of my product search?',
    aiResponse: 'For better search performance, I suggest implementing Azure Cognitive Search. This will provide full-text search capabilities, faceted navigation, and can handle complex queries efficiently. We can also add Redis caching for frequently searched terms.',
    createdAt: '2024-01-18T15:30:00Z'
  },
  {
    id: 3,
    projectId: 2,
    userMessage: 'What security measures should I implement for the API gateway?',
    aiResponse: 'For API gateway security, implement these measures: 1) JWT token validation, 2) Rate limiting with Azure API Management, 3) IP whitelisting for sensitive endpoints, 4) CORS configuration, and 5) Request/response logging for monitoring. I can help configure each of these.',
    createdAt: '2024-01-21T11:15:00Z'
  }
]

// Enhanced Mock Projects with full API structure
export const mockProjectsEnhanced: Project[] = [
  {
    id: 1,
    name: 'E-commerce Platform',
    description: 'Full-stack e-commerce solution with payment processing and inventory management',
    userRequirements: 'Need a scalable e-commerce platform with user authentication, product catalog, shopping cart, payment integration with Stripe, inventory management, and admin dashboard. Should handle about 1000 concurrent users.',
    processedRequirements: 'E-commerce platform requiring: Web application (React/Node.js), SQL database, blob storage for images, payment gateway integration, user authentication system, admin interface, and CDN for static assets.',
    status: 'Active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:22:00Z',
    userId: TEST_USER_ID,
    userAzureCredentialId: 1,
    resources: mockResources.slice(0, 3), // First 3 resources
    conversations: mockConversations.filter(c => c.projectId === 1)
  },
  {
    id: 2,
    name: 'API Gateway Service',
    description: 'Centralized API management and routing with authentication',
    userRequirements: 'I need a centralized API gateway that can route requests to different microservices, handle authentication, rate limiting, and provide monitoring and analytics.',
    processedRequirements: 'API Gateway solution requiring: Azure API Management or custom gateway service, authentication middleware, rate limiting, request routing, monitoring dashboard, and logging infrastructure.',
    status: 'Active',
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-22T09:15:00Z',
    userId: TEST_USER_ID,
    userAzureCredentialId: 1,
    resources: [mockResources[3]], // API gateway resource
    conversations: mockConversations.filter(c => c.projectId === 2)
  },
  {
    id: 3,
    name: 'Personal Blog Platform',
    description: 'Simple blog platform with CMS capabilities',
    userRequirements: 'A personal blog platform where I can write and publish articles, manage content, and allow readers to comment. Should be SEO-friendly and fast loading.',
    processedRequirements: 'Blog platform requiring: Static site generator or CMS, database for content, comment system, SEO optimization, CDN for fast loading, and admin interface for content management.',
    status: 'Provisioning',
    createdAt: '2024-01-25T09:00:00Z',
    updatedAt: '2024-01-25T09:30:00Z',
    userId: TEST_USER_ID,
    userAzureCredentialId: 2,
    resources: [mockResources[4]], // Blog resource
    conversations: []
  },
  {
    id: 4,
    name: 'Analytics Dashboard',
    description: 'Real-time analytics and reporting dashboard',
    userRequirements: 'Need a dashboard to visualize business metrics, user analytics, and generate reports. Should support real-time data updates and custom chart creation.',
    processedRequirements: 'Analytics dashboard requiring: Data visualization frontend, time-series database, real-time data pipeline, API for metrics collection, and export functionality for reports.',
    status: 'Draft',
    createdAt: '2024-01-28T16:00:00Z',
    updatedAt: '2024-01-28T16:00:00Z',
    userId: TEST_USER_ID,
    resources: [],
    conversations: []
  },
  {
    id: 5,
    name: 'Task Management System',
    description: 'Team collaboration and project management tool',
    userRequirements: 'A task management system for teams with project boards, task assignments, time tracking, file sharing, and progress reporting.',
    processedRequirements: 'Task management system requiring: Web application with real-time updates, user management, file storage, notification system, reporting engine, and mobile-responsive design.',
    status: 'Analyzing',
    createdAt: '2024-01-30T11:30:00Z',
    updatedAt: '2024-01-30T12:00:00Z',
    userId: TEST_USER_ID,
    userAzureCredentialId: 1,
    resources: [],
    conversations: []
  }
]

// Mock Azure Credentials for test user
export const mockAzureCredentials = [
  {
    id: 1,
    subscriptionId: 'demo-sub-prod-12345',
    subscriptionName: 'Demo Production Subscription',
    displayName: 'Production Environment',
    isDefault: true,
    isActive: true,
    lastValidated: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    subscriptionId: 'demo-sub-dev-67890',
    subscriptionName: 'Demo Development Subscription',
    displayName: 'Development Environment',
    isDefault: false,
    isActive: true,
    lastValidated: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    subscriptionId: 'demo-sub-test-11111',
    subscriptionName: 'Demo Testing Subscription',
    displayName: 'Testing Environment',
    isDefault: false,
    isActive: true,
    lastValidated: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    createdAt: '2024-01-15T00:00:00Z'
  }
]

// Mock resource metrics for demonstration
export const mockResourceMetrics = [
  {
    resourceId: 1,
    metricName: 'CPU Percentage',
    value: 45.2,
    unit: 'Percent',
    timestamp: new Date().toISOString()
  },
  {
    resourceId: 1,
    metricName: 'Memory Percentage',
    value: 62.8,
    unit: 'Percent',
    timestamp: new Date().toISOString()
  },
  {
    resourceId: 2,
    metricName: 'DTU Percentage',
    value: 23.5,
    unit: 'Percent',
    timestamp: new Date().toISOString()
  }
]

// Search function for mock projects
export const searchMockProjects = (searchTerm: string): Project[] => {
  if (!searchTerm.trim()) {
    return mockProjectsEnhanced
  }

  const searchLower = searchTerm.toLowerCase()
  return mockProjectsEnhanced.filter(
    (project) =>
      project.name.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.userRequirements.toLowerCase().includes(searchLower) ||
      project.status.toLowerCase().includes(searchLower)
  )
}