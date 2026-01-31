import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth from cookies (we'll set these from the client)
  const isAuthenticated =
    request.cookies.get("auth_authenticated")?.value === "true";
  const userRole = request.cookies.get("auth_role")?.value;

  // Allow login and auth pages without authentication
  if (pathname.startsWith("/(auth)") || pathname === "/login") {
    if (isAuthenticated) {
      // Redirect authenticated users away from login
      return NextResponse.redirect(
        new URL(`/${userRole}/dashboard`, request.url),
      );
    }
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith("/(dashboard)")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check role-based access
    if (pathname.startsWith("/faculty") && userRole !== "faculty") {
      return NextResponse.redirect(
        new URL(`/${userRole}/dashboard`, request.url),
      );
    }
    if (pathname.startsWith("/auditor") && userRole !== "auditor") {
      return NextResponse.redirect(
        new URL(`/${userRole}/dashboard`, request.url),
      );
    }
    if (pathname.startsWith("/staff-advisor") && userRole !== "staff-advisor") {
      return NextResponse.redirect(
        new URL(`/${userRole}/dashboard`, request.url),
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
