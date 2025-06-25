"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import {
  Home,
  FolderOpen,
  Settings,
  PlusCircle,
  BarChart3,
  Cloud,
  CreditCard,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Resources", href: "/resources", icon: Cloud },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void; // Add callback for mobile navigation
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const handleNavigation = () => {
    // Call the callback when navigating (useful for closing mobile sidebar)
    onNavigate?.();
  };

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        {/* Logo */}
        <div className="px-3 py-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 azure-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <h2 className="text-lg font-semibold text-primary">Easel</h2>
          </div>
        </div>

        {/* Quick Action */}
        <div className="px-3">
          <Button className="w-full justify-start" variant="azure" asChild>
            <Link href="/projects/new" onClick={handleNavigation}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Navigation */}
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive &&
                      "bg-azure-blue/10 text-azure-blue hover:bg-azure-blue/20"
                  )}
                  asChild
                >
                  <Link href={item.href} onClick={handleNavigation}>
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        {/* User Section */}
        <div className="px-3 py-2 border-t">
          <div className="flex items-center space-x-3 p-2">
            <UserAvatar
              firstName={useAuth().user?.firstName}
              lastName={useAuth().user?.lastName}
              size="md"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {useAuth().user?.firstName} {useAuth().user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {useAuth().user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
