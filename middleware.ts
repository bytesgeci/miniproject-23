import { NextRequest, NextResponse } from "next/server";
import { getDashboardPath, getRoleFromPath, isValidRole } from "@/lib/roles";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth from cookies (set on login)
  const isAuthenticated =
    request.cookies.get("auth_authenticated")?.value === "true";
  const userRole = request.cookies.get("auth_role")?.value;

  const isLoginRoute = pathname === "/login" || pathname === "/register";
  const isRootRoute = pathname === "/";

  if (isLoginRoute) {
    if (isAuthenticated && isValidRole(userRole)) {
      return NextResponse.redirect(
        new URL(getDashboardPath(userRole), request.url),
      );
    }
    return NextResponse.next();
  }

  if (isRootRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const routeRole = getRoleFromPath(pathname);
  if (routeRole) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!isValidRole(userRole)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Allow general users to view faculty profile pages from the user dashboard.
    if (
      userRole === "user" &&
      pathname.startsWith("/faculty/") &&
      pathname !== "/faculty"
    ) {
      return NextResponse.next();
    }

    if (userRole !== routeRole) {
      return NextResponse.redirect(
        new URL(getDashboardPath(userRole), request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
