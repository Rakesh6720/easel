// Utility functions for notifications management
import { type Notification } from "@/contexts/notification-context";

// Function to generate a new notification ID
export const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Function to simulate real-time notifications
export const generateMockNotification = (
  type: Notification["type"] = "info"
): Omit<Notification, "id" | "timestamp" | "read"> => {
  const notifications = {
    info: [
      {
        title: "System Update Available",
        message:
          "A new system update is available to improve performance and security.",
      },
      {
        title: "New Feature Released",
        message: "Check out our latest AI-powered cost optimization features.",
        actionUrl: "/analytics",
        actionText: "Explore",
      },
    ],
    success: [
      {
        title: "Deployment Successful",
        message: "Your Azure resources have been deployed successfully.",
        actionUrl: "/projects",
        actionText: "View Projects",
      },
      {
        title: "Backup Completed",
        message: "Your project data has been backed up successfully.",
      },
    ],
    warning: [
      {
        title: "Cost Alert",
        message: "Your Azure spending is approaching the monthly budget limit.",
        actionUrl: "/billing",
        actionText: "View Billing",
      },
      {
        title: "Resource Utilization High",
        message: "Some of your resources are running at high capacity.",
        actionUrl: "/resources",
        actionText: "Check Resources",
      },
    ],
    error: [
      {
        title: "Deployment Failed",
        message: "Failed to deploy resources. Please check your configuration.",
        actionUrl: "/projects",
        actionText: "Retry",
      },
      {
        title: "Service Unavailable",
        message: "One of your Azure services is currently unavailable.",
        actionUrl: "/resources",
        actionText: "Check Status",
      },
    ],
  };

  const typeNotifications = notifications[type];
  const randomNotification =
    typeNotifications[Math.floor(Math.random() * typeNotifications.length)];

  return {
    type,
    ...randomNotification,
  };
};

// Function to format notification timestamps
export const formatNotificationTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};

// Function to get notification priority
export const getNotificationPriority = (type: Notification["type"]): number => {
  const priorities = {
    error: 4,
    warning: 3,
    success: 2,
    info: 1,
  };
  return priorities[type] || 1;
};

// Function to sort notifications by priority and timestamp
export const sortNotificationsByPriority = (
  notifications: Notification[]
): Notification[] => {
  return notifications.sort((a, b) => {
    // First sort by read status (unread first)
    if (a.read !== b.read) {
      return a.read ? 1 : -1;
    }

    // Then by priority
    const priorityDiff =
      getNotificationPriority(b.type) - getNotificationPriority(a.type);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // Finally by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};
