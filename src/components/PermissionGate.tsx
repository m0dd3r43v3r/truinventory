"use client";

import { useSession } from "next-auth/react";
import { Permission, hasPermission } from "@/lib/permissions";
import { ReactNode } from "react";

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions
 * @param permission The permission required to view the children
 * @param children The content to render if the user has permission
 * @param fallback Optional content to render if the user doesn't have permission
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { data: session } = useSession();
  
  // If no session or no user, don't render anything
  if (!session?.user) {
    return null;
  }
  
  // Check if the user has the required permission
  const userHasPermission = hasPermission(session.user.role, permission);
  
  // Render children if user has permission, otherwise render fallback
  return userHasPermission ? <>{children}</> : <>{fallback}</>;
} 