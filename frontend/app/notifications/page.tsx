"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Filter, ArrowLeft, ExternalLink } from "lucide-react";
import {
  useNotifications,
  type Notification,
} from "@/contexts/notification-context";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "✅";
    case "warning":
      return "⚠️";
    case "error":
      return "❌";
    case "info":
    default:
      return "ℹ️";
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "border-green-200 bg-green-50";
    case "warning":
      return "border-yellow-200 bg-yellow-50";
    case "error":
      return "border-red-200 bg-red-50";
    case "info":
    default:
      return "border-blue-200 bg-blue-50";
  }
};

const getTypeColor = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "bg-green-100 text-green-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "error":
      return "bg-red-100 text-red-800";
    case "info":
    default:
      return "bg-blue-100 text-blue-800";
  }
};

export default function NotificationsPage() {
  const notificationContext = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread" | Notification["type"]>(
    "all"
  );

  if (!notificationContext) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Notifications not available</p>
        </div>
      </div>
    );
  }

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addTestNotification,
  } = notificationContext;

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleRemove = (id: string) => {
    removeNotification(id);
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
        <span>Notifications</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your Azure resources and projects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={addTestNotification}>
            + Add Test
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
            <div className="flex space-x-2">
              {[
                { value: "all", label: "All" },
                { value: "unread", label: "Unread" },
                { value: "success", label: "Success" },
                { value: "warning", label: "Warning" },
                { value: "error", label: "Error" },
                { value: "info", label: "Info" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(option.value as typeof filter)}
                >
                  {option.label}
                  {option.value === "unread" && unreadCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                No notifications found
              </h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-all hover:shadow-md",
                !notification.read && getNotificationColor(notification.type)
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-2xl mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">
                            {notification.title}
                          </h3>
                          <Badge className={getTypeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="secondary">New</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <span>
                            {format(new Date(notification.timestamp), "PPp")}
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            {formatDistanceToNow(
                              new Date(notification.timestamp),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                        {notification.actionUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={notification.actionUrl}>
                              {notification.actionText || "View"}
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    {!notification.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(notification.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Summary</CardTitle>
            <CardDescription>Overview of your notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {unreadCount}
                </p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter((n) => n.type === "success").length}
                </p>
                <p className="text-sm text-muted-foreground">Success</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter((n) => n.type === "error").length}
                </p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
