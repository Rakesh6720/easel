import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (!date) return "Never";

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

export function getStatusColor(status: string | any): string {
  const statusStr = typeof status === "string" ? status : String(status || "");
  switch (statusStr.toLowerCase()) {
    case "active":
    case "running":
      return "status-running";
    case "stopped":
    case "failed":
      return "status-stopped";
    case "provisioning":
      return "status-provisioning";
    case "warning":
      return "status-warning";
    default:
      return "status-provisioning";
  }
}

export function getResourceTypeIcon(resourceType: string): string {
  if (!resourceType) return "❓"; // Default icon for unknown/undefined types
  
  switch (resourceType.toLowerCase()) {
    case "microsoft.web/sites":
      return "🌐";
    case "microsoft.storage/storageaccounts":
      return "📦";
    case "microsoft.sql/servers/databases":
      return "🗄️";
    case "microsoft.compute/virtualmachines":
      return "💻";
    default:
      return "☁️";
  }
}
