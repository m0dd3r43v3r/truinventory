import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// List of public routes that don't require authentication
const publicRoutes = ["/login", "/setup"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Check if it's a public route
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return null;
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 