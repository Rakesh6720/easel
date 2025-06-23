"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Server,
  Plus,
  ArrowUpRight,
  Cloud,
  Database,
  Globe
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

// Mock data - in real app this would come from API
const stats = [
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

const recentProjects = [
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

const resourceTypes = [
  { name: "App Services", count: 15, icon: Globe, color: "bg-azure-blue" },
  { name: "Storage Accounts", count: 8, icon: Database, color: "bg-azure-teal" },
  { name: "SQL Databases", count: 5, icon: Server, color: "bg-azure-green" },
  { name: "Other", count: 19, icon: Cloud, color: "bg-azure-purple" }
]

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Azure resources and projects
          </p>
        </div>
        <Button variant="azure" asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.trend === 'up' ? 'text-azure-green' : 'text-azure-red'
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your most recently updated projects
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects">
                  View All
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 azure-gradient rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {project.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{project.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{project.resources} resources</span>
                        <span>{formatCurrency(project.cost)}/month</span>
                        <span>Updated {project.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`status-indicator ${project.status === 'Active' ? 'status-running' : 'status-provisioning'}`}>
                      {project.status}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${project.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Types */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Types</CardTitle>
            <CardDescription>
              Distribution of your Azure resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resourceTypes.map((type) => (
                <div key={type.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center`}>
                      <type.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">
                    {type.count}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6" asChild>
              <Link href="/resources">
                View All Resources
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}