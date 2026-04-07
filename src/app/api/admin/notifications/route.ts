import { NextRequest, NextResponse } from "next/server";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/adminNotifications";

export async function GET() {
  try {
    const notifications = await listAdminNotifications();
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Admin notifications load error:", error);
    return NextResponse.json(
      { error: "Failed to load admin notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
      markAllRead?: boolean;
    };

    if (body.markAllRead) {
      await markAllAdminNotificationsRead();
      return NextResponse.json({ success: true });
    }

    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await markAdminNotificationRead(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin notifications update error:", error);
    return NextResponse.json(
      { error: "Failed to update admin notifications" },
      { status: 500 },
    );
  }
}
