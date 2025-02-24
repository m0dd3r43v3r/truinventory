"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Package, QrCode, Map, Settings, Users, LogOut, History, FolderIcon, ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Categories", href: "/categories", icon: Map },
  { name: "Locations", href: "/locations", icon: FolderIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsExpanded(window.innerWidth >= 768);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative flex">
      <div className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        isExpanded ? "w-64" : "w-16",
        "fixed md:relative"
      )}>
        <div className={cn(
          "flex items-center border-b",
          isExpanded ? "h-40 justify-center" : "h-20 justify-center"
        )}>
          <div className={cn(
            "relative",
            isExpanded ? "h-28 w-28" : "h-12 w-12"
          )}>
            <Image
              src="/logo.png"
              alt="TruInventory Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        <nav className="flex flex-col flex-1 space-y-1 p-2">
          <div className="flex-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-primary/10 text-muted-foreground",
                    !isExpanded && "justify-center px-2"
                  )}
                  title={!isExpanded ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {isExpanded && item.name}
                </Link>
              );
            })}
          </div>

          {isAdmin && (
            <div className="border-t pt-2">
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/settings")
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-primary/10 text-muted-foreground",
                  !isExpanded && "justify-center px-2"
                )}
                title={!isExpanded ? "Settings" : undefined}
              >
                <Settings className="h-5 w-5" />
                {isExpanded && "Settings"}
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t p-2">
          {session?.user && isExpanded && (
            <div className="px-3 py-2">
              <div className="text-sm font-medium">{session.user.name}</div>
              <div className="text-xs text-muted-foreground">{session.user.email}</div>
            </div>
          )}
          <div className={cn(
            "flex items-center px-2",
            isExpanded ? "justify-between" : "justify-center flex-col gap-2"
          )}>
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(
                "flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isExpanded && "justify-center"
              )}
              title={!isExpanded ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5" />
              {isExpanded && "Logout"}
            </button>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "absolute -right-3 top-24 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm transition-transform hover:bg-accent",
          isExpanded ? "rotate-0" : "rotate-180",
          "hidden md:flex"
        )}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
} 