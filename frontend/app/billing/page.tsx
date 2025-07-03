"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Download,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { billingService, type BillingData, type CostOptimizationRecommendation, type ProjectCostBreakdownItem } from "@/lib/billing";
import { isTestUser } from "@/lib/test-user";
import {
  type CurrentBill,
  type BillingPeriod,
  type CostBreakdownItem,
  type PaymentMethod,
} from "@/lib/mock-billing-data";


export default function BillingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [projectBreakdown, setProjectBreakdown] = useState<ProjectCostBreakdownItem[]>([]);
  const [breakdownView, setBreakdownView] = useState<"service" | "project">("service");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const [data, projects] = await Promise.all([
          billingService.getBillingData(),
          billingService.getProjectCostBreakdown()
        ]);
        console.log("Billing data:", data);
        console.log("Project breakdown:", projects);
        setBillingData(data);
        setProjectBreakdown(projects);
      } catch (error) {
        console.error("Error fetching billing data:", error);
        setBillingData(null);
        setProjectBreakdown([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate dynamic values using helper functions
  const threeMonthAvg = billingData?.threeMonthAverage || 0;
  const monthOverMonthChange = billingData?.monthOverMonthChange || 0;
  const budgetInfo = billingData?.budgetInfo || { percentage: 0, budget: 0, currentSpend: 0, alertLevel: "normal" };
  const optimizationInfo = {
    recommendations: billingData?.optimizationRecommendations?.length || 0,
    savings: billingData?.optimizationRecommendations?.reduce((sum, rec) => sum + rec.estimatedMonthlySavings, 0) || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-azure-blue flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Dashboard
        </Link>
        <span>/</span>
        <span>Billing & Usage</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Manage your Azure spending and view cost breakdowns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <CreditCard className="mr-2 h-4 w-4" />
            Payment Method
          </Button>
        </div>
      </div>

      {/* Current Bill Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Bill
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(billingData?.currentBill?.amount || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Due{" "}
                  {formatDate(billingData?.currentBill?.dueDate || new Date())}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Month
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    billingData?.billingHistory?.[0]?.amount || 0
                  )}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {monthOverMonthChange > 0 ? "+" : ""}
                  {monthOverMonthChange.toFixed(1)}% from prev
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  3-Month Avg
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(threeMonthAvg)}
                </p>
                <p className="text-xs text-muted-foreground">Trending stable</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Status
                </p>
                <p className="text-2xl font-bold text-green-600">Current</p>
                <p className="text-xs text-muted-foreground">
                  Auto-pay enabled
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cost Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Cost Breakdown by {breakdownView === "service" ? "Service" : "Project"}
                </CardTitle>
                <CardDescription>
                  Azure resource costs for{" "}
                  {billingData?.currentBill?.period || "current period"}
                </CardDescription>
              </div>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setBreakdownView("service")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    breakdownView === "service"
                      ? "bg-white shadow-sm text-azure-blue"
                      : "text-muted-foreground hover:text-gray-700"
                  }`}
                >
                  By Service
                </button>
                <button
                  onClick={() => setBreakdownView("project")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    breakdownView === "project"
                      ? "bg-white shadow-sm text-azure-blue"
                      : "text-muted-foreground hover:text-gray-700"
                  }`}
                >
                  By Project
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breakdownView === "service" ? (
                // Service breakdown
                (billingData?.costBreakdown || []).map(
                  (item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 azure-gradient rounded-full" />
                        <div>
                          <p className="font-medium">{item.service}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.percentage}% of total
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(item.amount)}
                        </p>
                        <div className="flex items-center text-sm">
                          {item.trend === "up" ? (
                            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={
                              item.trend === "up"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {item.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )
              ) : (
                // Project breakdown
                projectBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No project data available</p>
                    <p className="text-sm">Project cost breakdown will appear here once data is loaded.</p>
                  </div>
                ) : (
                projectBreakdown.map((project, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <div>
                          <p className="font-medium">{project.projectName}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.percentage}% of total • {project.resourceCount} resources
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(project.amount)}
                        </p>
                        <div className="flex items-center text-sm">
                          {project.trend === "up" ? (
                            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={
                              project.trend === "up"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {project.change}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Project resources */}
                    <div className="ml-5 space-y-2">
                      {project.resources.slice(0, 3).map((resource, resourceIndex) => (
                        <div
                          key={resourceIndex}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            <span className="text-muted-foreground">
                              {resource.resourceName} ({resource.resourceType})
                            </span>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(resource.amount)}
                          </span>
                        </div>
                      ))}
                      {project.resources.length > 3 && (
                        <div className="text-sm text-muted-foreground ml-3">
                          +{project.resources.length - 3} more resources
                        </div>
                      )}
                    </div>
                  </div>
                ))
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method & Alerts */}
        <div className="space-y-6">
          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="font-medium">
                      •••• •••• ••••{" "}
                      {billingData?.paymentMethod?.last4 || "0000"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {billingData?.paymentMethod?.expiryMonth || "00"}/
                      {billingData?.paymentMethod?.expiryYear || "00"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Update Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Budget Alert</p>
                    <p className="text-xs text-muted-foreground">
                      You're at {budgetInfo.percentage}% of your monthly budget
                      (${budgetInfo.budget.toLocaleString()})
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Cost Optimization</p>
                    <p className="text-xs text-muted-foreground">
                      {optimizationInfo.recommendations} recommendations to
                      reduce costs by ~${optimizationInfo.savings}/month
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your previous invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Bill */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {billingData?.currentBill?.period || "Current Period"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due{" "}
                    {formatDate(
                      billingData?.currentBill?.dueDate || new Date()
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(billingData?.currentBill?.amount || 0)}
                  </p>
                  <Badge
                    className={getStatusColor(
                      billingData?.currentBill?.status || "pending"
                    )}
                  >
                    {billingData?.currentBill?.status || "pending"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>
            </div>

            {/* Historical Bills */}
            {(billingData?.billingHistory || []).map((bill: any) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{bill.period}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid {bill.paidDate ? formatDate(bill.paidDate) : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(bill.amount)}
                    </p>
                    <Badge className={getStatusColor(bill.status)}>
                      {bill.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
