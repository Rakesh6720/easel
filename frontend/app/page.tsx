import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Cloud, Zap, Shield, BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

function AuthenticatedNav() {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-azure-blue rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {user?.firstName}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <Button variant="ghost" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
      <Button variant="azure" asChild>
        <Link href="/register">Get Started</Link>
      </Button>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-azure-gray-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 azure-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-bold text-primary">Easel</span>
          </div>
          <AuthenticatedNav />
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Azure Resource Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Tell us what you want to build, and Easel will analyze your requirements, 
            recommend the perfect Azure resources, and provision them in your subscription.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" variant="azure" asChild>
              <Link href="/projects/new">
                Start Building
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to manage Azure resources
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From natural language requirements to production-ready infrastructure
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 azure-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Describe your application in natural language and get smart Azure resource recommendations
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-azure-teal rounded-lg flex items-center justify-center mx-auto mb-4">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Auto Provisioning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically provision resources in your Azure subscription with best practices
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-azure-green rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Usage Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor costs, performance metrics, and resource utilization in real-time
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-azure-purple rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Secure & Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Uses your Azure credentials securely. Resources are created in your subscription
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="azure-gradient-subtle border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to simplify your Azure workflow?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join developers who are building faster with AI-powered infrastructure management
            </p>
            <Button size="lg" variant="azure" asChild>
              <Link href="/projects/new">
                Create Your First Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 azure-gradient rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-primary">Easel</span>
          </div>
          <p className="text-sm text-gray-500">
            Built for Azure developers, by Azure developers
          </p>
        </div>
      </footer>
    </div>
  )
}