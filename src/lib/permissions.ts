import { Role } from "@prisma/client";

// Define permission levels
export enum Permission {
  READ = "read",
  EDIT = "edit",
  ADMIN = "admin"
}

// Define which roles have which permissions
const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [Permission.READ, Permission.EDIT, Permission.ADMIN],
  EDITOR: [Permission.READ, Permission.EDIT],
  READ_ONLY: [Permission.READ],
  USER: [Permission.READ, Permission.EDIT] // Legacy role, treated as EDITOR for backward compatibility
};

// Check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

// Get all permissions for a role
export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

// Get a human-readable name for a role
export function getRoleName(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "EDITOR":
      return "Editor";
    case "READ_ONLY":
      return "Read Only";
    case "USER":
      return "User";
    default:
      return role;
  }
}

// Get a description for a role
export function getRoleDescription(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Full access to all features, including user management and settings";
    case "EDITOR":
      return "Can view, add, edit, and delete inventory items";
    case "READ_ONLY":
      return "Can only view inventory items and reports";
    case "USER":
      return "Standard user with edit permissions (legacy)";
    default:
      return "";
  }
} 