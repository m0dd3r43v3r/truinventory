import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Permission, hasPermission } from "@/lib/permissions";

// List of public routes that don't require authentication
const publicRoutes = ["/login", "/setup", "/api/auth"];

// Define which API routes require which permissions
const routePermissions: Record<string, Permission> = {
  // Item routes
  "/api/items": Permission.READ,
  "/api/items/POST": Permission.EDIT,
  "/api/items/PUT": Permission.EDIT,
  "/api/items/PATCH": Permission.EDIT,
  "/api/items/DELETE": Permission.EDIT,
  
  // Category routes
  "/api/categories": Permission.READ,
  "/api/categories/POST": Permission.EDIT,
  "/api/categories/PUT": Permission.EDIT,
  "/api/categories/PATCH": Permission.EDIT,
  "/api/categories/DELETE": Permission.EDIT,
  
  // Location routes
  "/api/locations": Permission.READ,
  "/api/locations/POST": Permission.EDIT,
  "/api/locations/PUT": Permission.EDIT,
  "/api/locations/PATCH": Permission.EDIT,
  "/api/locations/DELETE": Permission.EDIT,
  
  // User management (admin only)
  "/api/users": Permission.ADMIN,
  "/api/users/POST": Permission.ADMIN,
  "/api/users/PUT": Permission.ADMIN,
  "/api/users/PATCH": Permission.ADMIN,
  "/api/users/DELETE": Permission.ADMIN,
  
  // Settings (admin only)
  "/api/settings": Permission.ADMIN,
  "/api/settings/POST": Permission.ADMIN,
  
  // Dashboard (read access)
  "/api/dashboard": Permission.READ,
  
  // Audit logs (admin only)
  "/api/audit-logs": Permission.ADMIN,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if it's a public route - allow access without authentication
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Skip auth for static files and images
  if (
    pathname.startsWith('/_next') || 
    pathname.includes('/favicon.ico') ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next();
  }
  
  // Get the token
  const token = await getToken({ req: request });
  
  // If no token and not a public route, redirect to login
  if (!token) {
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith('/api')) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // For page routes, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // For API routes, check permissions
  if (pathname.startsWith('/api')) {
    const method = request.method;
    
    // Check if this route+method requires permission
    const requiredPermission = routePermissions[`${pathname}/${method}`] || routePermissions[pathname];
    
    // If no permission required, allow access
    if (!requiredPermission) {
      return NextResponse.next();
    }
    
    // Check if user has the required permission
    const userRole = token.role as string;
    if (!hasPermission(userRole as any, requiredPermission)) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  
  // User is authenticated and has permission, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 