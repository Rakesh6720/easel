"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Calendar,
  DollarSign,
  Server
} from "lucide-react"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import Link from "next/link"

// Mock data - in real app this would come from API
const projects = [
  {
    id: 1,
    name: "E-commerce Platform",
    description: "Full-stack e-commerce solution with payment processing",
    status: "Active",
    resourceCount: 8,
    monthlyCost: 425.32,
    createdAt: "2024-01-15T10:30:00Z",
    lastUpdated: "2024-01-20T14:22:00Z",
    requirements: "Need a scalable e-commerce platform with user authentication, product catalog, shopping cart, and payment integration"
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
    requirements: "API gateway to handle authentication, rate limiting, and routing for microservices"
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
    requirements: "Data pipeline for processing customer events, analytics, and generating business insights"
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
    requirements: "Backend API for mobile app with user management, push notifications, and data sync"
  },
  {
    id: 5,
    name: "IoT Sensor Network",
    description: "IoT device management and data collection",
    status: "Error",
    resourceCount: 2,
    monthlyCost: 78.50,
    createdAt: "2024-01-12T14:45:00Z",
    lastUpdated: "2024-01-16T10:15:00Z",
    requirements: "System to collect and process data from IoT sensors with real-time monitoring"
  }
]

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return <Play className="h-4 w-4 text-azure-green" />
    case 'provisioning':
      return <div className="h-4 w-4 rounded-full bg-azure-light-blue animate-pulse" />
    case 'error':
      return <Pause className="h-4 w-4 text-azure-red" />
    default:
      return <div className="h-4 w-4 rounded-full bg-azure-gray-400" />
  }
}

export default function ProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI-powered Azure projects
          </p>
        </div>
        <Button variant="azure" asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 azure-gradient rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {project.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-azure-blue transition-colors">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(project.status)}
                      <span className={`text-sm font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {project.resourceCount} resources
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatCurrency(project.monthlyCost)}/mo
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(project.createdAt)}</span>
                  </div>
                  <div>Updated {formatDate(project.lastUpdated)}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/projects/${project.id}`}>
                      View Details
                    </Link>
                  </Button>
                  {project.status === 'Active' && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/projects/${project.id}/resources`}>
                        Resources
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State - shown when no projects match filters */}
      {projects.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 azure-gradient-subtle rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-azure-blue" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first AI-powered Azure project
            </p>
            <Button variant="azure" asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}