// Mock billing data for the billing page

export interface BillingPeriod {
  id: number;
  period: string;
  amount: number;
  status: "current" | "paid" | "overdue";
  paidDate?: string;
  downloadUrl?: string;
}

export interface CurrentBill {
  amount: number;
  period: string;
  dueDate: string;
  status: "current" | "paid" | "overdue";
  currency: string;
}

export interface CostBreakdownItem {
  service: string;
  amount: number;
  percentage: number;
  change: string;
  trend: "up" | "down";
}

export interface PaymentMethod {
  type: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

export const currentBill: CurrentBill = {
  amount: 1247.83,
  period: "December 2024",
  dueDate: "2025-01-15T00:00:00Z",
  status: "current",
  currency: "USD",
};

export const billingHistory: BillingPeriod[] = [
  {
    id: 1,
    period: "November 2024",
    amount: 1156.42,
    status: "paid",
    paidDate: "2024-12-01T10:30:00Z",
    downloadUrl: "#",
  },
  {
    id: 2,
    period: "October 2024",
    amount: 1089.76,
    status: "paid",
    paidDate: "2024-11-01T10:30:00Z",
    downloadUrl: "#",
  },
  {
    id: 3,
    period: "September 2024",
    amount: 978.23,
    status: "paid",
    paidDate: "2024-10-01T10:30:00Z",
    downloadUrl: "#",
  },
  {
    id: 4,
    period: "August 2024",
    amount: 1203.45,
    status: "paid",
    paidDate: "2024-09-01T10:30:00Z",
    downloadUrl: "#",
  },
];

export const costBreakdown: CostBreakdownItem[] = [
  {
    service: "Azure App Service",
    amount: 456.78,
    percentage: 36.6,
    change: "+5.2%",
    trend: "up",
  },
  {
    service: "Azure SQL Database",
    amount: 312.45,
    percentage: 25.0,
    change: "+2.1%",
    trend: "up",
  },
  {
    service: "Azure Storage",
    amount: 178.23,
    percentage: 14.3,
    change: "-1.5%",
    trend: "down",
  },
  {
    service: "Azure Cache for Redis",
    amount: 123.67,
    percentage: 9.9,
    change: "+8.3%",
    trend: "up",
  },
  {
    service: "Application Insights",
    amount: 89.45,
    percentage: 7.2,
    change: "+0.8%",
    trend: "up",
  },
  {
    service: "Other Services",
    amount: 87.25,
    percentage: 7.0,
    change: "-3.2%",
    trend: "down",
  },
];

export const paymentMethod: PaymentMethod = {
  type: "Visa",
  last4: "4242",
  expiryMonth: 12,
  expiryYear: 2026,
};

// Helper functions for billing calculations
export const calculateThreeMonthAverage = (): number => {
  return (
    billingHistory.slice(0, 3).reduce((sum, bill) => sum + bill.amount, 0) / 3
  );
};

export const calculateMonthOverMonthChange = (): number => {
  if (billingHistory.length < 2) return 0;
  const current = currentBill.amount;
  const previous = billingHistory[0].amount;
  return ((current - previous) / previous) * 100;
};

export const getBudgetUtilization = (): {
  percentage: number;
  budget: number;
} => {
  const monthlyBudget = 1600;
  const percentage = (currentBill.amount / monthlyBudget) * 100;
  return { percentage: Math.round(percentage), budget: monthlyBudget };
};

export const getCostOptimizationSavings = (): {
  recommendations: number;
  savings: number;
} => {
  return { recommendations: 2, savings: 45 };
};
