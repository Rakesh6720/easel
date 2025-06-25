"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// Notification types
export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

// Notification context interface
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  addTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Deployment Complete",
    message:
      "Your E-commerce Platform project has been successfully deployed to Azure.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    read: false,
    actionUrl: "/projects/1",
    actionText: "View Project",
  },
  {
    id: "2",
    type: "warning",
    title: "Resource Cost Alert",
    message:
      "Your monthly Azure spending is approaching the budget limit of $1000.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    actionUrl: "/billing",
    actionText: "View Billing",
  },
  {
    id: "3",
    type: "info",
    title: "New Feature Available",
    message:
      "AI-powered cost optimization recommendations are now available in your dashboard.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    read: false,
    actionUrl: "/analytics",
    actionText: "Learn More",
  },
  {
    id: "4",
    type: "error",
    title: "Provisioning Failed",
    message:
      "Failed to provision resources for IoT Sensor Network project. Please check your configuration.",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    read: false,
    actionUrl: "/projects/5",
    actionText: "Retry",
  },
  {
    id: "5",
    type: "success",
    title: "Backup Completed",
    message:
      "Weekly backup of your project data has been completed successfully.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: "6",
    type: "info",
    title: "Welcome to Easel!",
    message:
      "Get started by creating your first AI-powered Azure project. Click here to explore the dashboard.",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    read: false,
    actionUrl: "/dashboard",
    actionText: "Explore Dashboard",
  },
  {
    id: "7",
    type: "warning",
    title: "Security Update Required",
    message:
      "A security update is available for your Azure resources. Please review and apply the updates.",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    read: false,
    actionUrl: "/resources",
    actionText: "View Resources",
  },
];

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const addNotification = useCallback(
    (newNotification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const notification: Notification = {
        ...newNotification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    },
    []
  );

  // Helper function to add a test notification (useful for testing)
  const addTestNotification = useCallback(() => {
    const testNotifications = [
      {
        type: "success" as const,
        title: "Test Success",
        message:
          "This is a test success notification to demonstrate the functionality.",
        actionUrl: "/dashboard",
        actionText: "View Dashboard",
      },
      {
        type: "warning" as const,
        title: "Test Warning",
        message:
          "This is a test warning notification to show how warnings appear.",
        actionUrl: "/resources",
        actionText: "Check Resources",
      },
      {
        type: "error" as const,
        title: "Test Error",
        message:
          "This is a test error notification to demonstrate error handling.",
        actionUrl: "/projects",
        actionText: "Fix Issue",
      },
      {
        type: "info" as const,
        title: "Test Information",
        message:
          "This is a test info notification to show general information display.",
      },
    ];

    const randomNotification =
      testNotifications[Math.floor(Math.random() * testNotifications.length)];
    addNotification(randomNotification);
  }, [addNotification]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
    addTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  return context;
}

// Hook that throws error if context is missing (for components that require it)
export function useNotificationsRequired() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationsRequired must be used within a NotificationProvider"
    );
  }
  return context;
}
