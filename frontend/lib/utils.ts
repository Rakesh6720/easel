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

export function getStatusColor(status: string | number): string {
  // Handle both string and numeric status values
  let statusStr: string;

  if (typeof status === "number") {
    // Convert numeric status codes from backend enum
    switch (status) {
      case 0:
        statusStr = "planned";
        break;
      case 1:
        statusStr = "provisioning";
        break;
      case 2:
        statusStr = "active";
        break;
      case 3:
        statusStr = "failed";
        break;
      case 4:
        statusStr = "deleting";
        break;
      case 5:
        statusStr = "deleted";
        break;
      default:
        statusStr = "unknown";
        break;
    }
  } else {
    statusStr = String(status || "").toLowerCase();
  }

  switch (statusStr) {
    case "active":
    case "running":
      return "status-running";
    case "failed":
    case "error":
      return "status-failed";
    case "stopped":
    case "deleted":
      return "status-stopped";
    case "provisioning":
    case "deleting":
      return "status-provisioning";
    case "planned":
      return "status-planned";
    case "warning":
      return "status-warning";
    default:
      return "status-unknown";
  }
}

export function getStatusText(status: string | number): string {
  // Convert status to human-readable text
  if (typeof status === "number") {
    switch (status) {
      case 0:
        return "Planned";
      case 1:
        return "Provisioning";
      case 2:
        return "Active";
      case 3:
        return "Failed";
      case 4:
        return "Deleting";
      case 5:
        return "Deleted";
      default:
        return "Unknown";
    }
  }

  // Handle string status
  const statusStr = String(status || "").toLowerCase();
  switch (statusStr) {
    case "active":
      return "Active";
    case "running":
      return "Running";
    case "failed":
      return "Failed";
    case "error":
      return "Failed";
    case "stopped":
      return "Stopped";
    case "provisioning":
      return "Provisioning";
    case "deleting":
      return "Deleting";
    case "deleted":
      return "Deleted";
    case "planned":
      return "Planned";
    case "warning":
      return "Warning";
    default:
      return "Unknown";
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
