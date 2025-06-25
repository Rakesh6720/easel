import { formatCurrency } from '@/lib/utils'
import { 
  Activity, 
  DollarSign, 
  Server, 
  TrendingUp,
  Globe,
  Database,
  Cloud
} from "lucide-react"

// Dashboard statistics interface
export interface DashboardStat {
  title: string
  value: string
  change: string
  icon: any
  trend: 'up' | 'down'
}

// Recent project interface
export interface RecentProject {
  id: number
  name: string
  status: string
  resources: number
  cost: number
  lastUpdated: string
}

// Resource type interface
export interface ResourceType {
  name: string
  count: number
  icon: any
  color: string
}

// Mock dashboard statistics
export const mockDashboardStats: DashboardStat[] = [
  {
    title: "Active Projects",
    value: "12",
    change: "+2 from last month",
    icon: Activity,
    trend: "up"
  },
  {
    title: "Monthly Cost",
    value: formatCurrency(2847.32),
    change: "-12% from last month",
    icon: DollarSign,
    trend: "down"
  },
  {
    title: "Active Resources",
    value: "47",
    change: "+8 from last month",
    icon: Server,
    trend: "up"
  },
  {
    title: "Cost Savings",
    value: formatCurrency(423.12),
    change: "Optimized this month",
    icon: TrendingUp,
    trend: "up"
  }
]

// Mock recent projects
export const mockRecentProjects: RecentProject[] = [
  {
    id: 1,
    name: "E-commerce Platform",
    status: "Active",
    resources: 8,
    cost: 425.32,
    lastUpdated: "2 hours ago"
  },
  {
    id: 2,
    name: "API Gateway Service",
    status: "Provisioning",
    resources: 3,
    cost: 156.21,
    lastUpdated: "1 day ago"
  },
  {
    id: 3,
    name: "Data Analytics Pipeline",
    status: "Active",
    resources: 12,
    cost: 892.45,
    lastUpdated: "3 days ago"
  }
]

// Mock resource types
export const mockResourceTypes: ResourceType[] = [
  { name: "App Services", count: 15, icon: Globe, color: "bg-azure-blue" },
  { name: "Storage Accounts", count: 8, icon: Database, color: "bg-azure-teal" },
  { name: "SQL Databases", count: 5, icon: Server, color: "bg-azure-green" },
  { name: "Other", count: 19, icon: Cloud, color: "bg-azure-purple" }
]

// Helper functions for dashboard data
export const getDashboardSummary = () => {
  const totalProjects = mockRecentProjects.length
  const totalResources = mockResourceTypes.reduce((sum, type) => sum + type.count, 0)
  const totalCost = mockRecentProjects.reduce((sum, project) => sum + project.cost, 0)
  const activeProjects = mockRecentProjects.filter(p => p.status === 'Active').length

  return {
    totalProjects,
    totalResources,
    totalCost,
    activeProjects,
    averageCost: totalProjects > 0 ? totalCost / totalProjects : 0
  }
}

export const getProjectsByStatus = (status: string) => {
  return mockRecentProjects.filter(project => project.status === status)
}

export const getResourceTypeByName = (name: string) => {
  return mockResourceTypes.find(type => type.name === name)
}
