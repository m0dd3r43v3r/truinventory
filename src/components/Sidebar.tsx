"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, QrCode, Map, Settings, Users, LogOut, History } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { signOut, useSession } from "next-auth/react";

const navigation = [
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Categories", href: "/categories", icon: Map },
  { name: "QR Codes", href: "/qr-codes", icon: QrCode },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Audit Logs", href: "/audit-logs", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">TruInventory</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-primary/10 text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-2 border-t" />
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-primary/10 text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t p-4 space-y-4">
        {session?.user && (
          <div className="px-3 py-2">
            <div className="text-sm font-medium">{session.user.name}</div>
            <div className="text-xs text-muted-foreground">{session.user.email}</div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 rounded-md p-2 text-sm font-medium text-muted-foreground hover:bg-primary/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
} 