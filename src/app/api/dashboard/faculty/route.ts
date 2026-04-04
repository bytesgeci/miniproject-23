import { NextRequest, NextResponse } from "next/server";
import { getFacultyDashboardData } from "@/lib/dashboardData";
import { buildTimingResponseHeaders } from "@/lib/serverTiming";

export async function GET(request: NextRequest) {
  const requestStart = Date.now();
  const queryUsername = request.nextUrl.searchParams.get("username");
  const cookieUsername = request.cookies.get("auth_user")?.value ?? null;
  const username = queryUsername ?? cookieUsername;
  const data = await getFacultyDashboardData(username);

  const totalDurationMs = Date.now() - requestStart;
  if (totalDurationMs > 1200) {
    console.warn("Slow faculty dashboard GET", {
      username,
      totalDurationMs,
    });
  }

  const cacheControl =
    process.env.NODE_ENV === "production"
      ? "private, max-age=20, stale-while-revalidate=60"
      : "no-store";

  return NextResponse.json(data, {
    headers: buildTimingResponseHeaders(
      [{ name: "total", durationMs: totalDurationMs }],
      {
        "Cache-Control": cacheControl,
      },
    ),
  });
}
