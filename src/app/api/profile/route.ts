import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { findUserById, updateUserById } from "@/lib/userStore";
import { isPrimaryAdminEmail } from "@/lib/adminConfig";
import { createAdminNotification } from "@/lib/adminNotifications";
import {
  getCachedProfile,
  invalidateCachedProfile,
  setCachedProfile,
} from "@/lib/profileCache";
import { buildTimingResponseHeaders } from "@/lib/serverTiming";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const requestStart = Date.now();
  let dbDurationMs = 0;
  let cacheStatus = "MISS";

  try {
    const userId = String(
      request.nextUrl.searchParams.get("userId") || "",
    ).trim();
    if (!userId) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 },
      );
    }

    const cacheKey = `profile:${userId}`;
    const cachedUser = getCachedProfile<Record<string, unknown>>(cacheKey);

    if (cachedUser) {
      cacheStatus = "HIT";
      const totalDurationMs = Date.now() - requestStart;
      return NextResponse.json(
        { user: cachedUser },
        {
          headers: buildTimingResponseHeaders(
            [
              { name: "cache", durationMs: 0.1, description: "profile-cache" },
              { name: "total", durationMs: totalDurationMs },
            ],
            {
              "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
              "X-Profile-Cache": cacheStatus,
            },
          ),
        },
      );
    }

    const dbStart = Date.now();
    const user = await findUserById(userId);
    dbDurationMs = Date.now() - dbStart;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...safeUser } = user;
    setCachedProfile(cacheKey, safeUser, 60_000);

    const totalDurationMs = Date.now() - requestStart;
    if (totalDurationMs > 1200) {
      console.warn("Slow profile GET", {
        userId,
        totalDurationMs,
        dbDurationMs,
      });
    }

    return NextResponse.json(
      { user: safeUser },
      {
        headers: buildTimingResponseHeaders(
          [
            { name: "db", durationMs: dbDurationMs, description: "find-user" },
            { name: "total", durationMs: totalDurationMs },
          ],
          {
            "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
            "X-Profile-Cache": cacheStatus,
          },
        ),
      },
    );
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const requestStart = Date.now();
  let dbDurationMs = 0;

  try {
    const body = (await request.json()) as {
      userId?: string;
      name?: string;
      email?: string;
      phone?: string;
      experience?: string;
    };

    const userId = String(body.userId || "").trim();
    if (!userId) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 },
      );
    }

    let dbStart = Date.now();
    const user = await findUserById(userId);
    dbDurationMs += Date.now() - dbStart;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdminUser =
      user.role === "admin" ||
      (Array.isArray(user.roles) && user.roles.includes("admin"));

    if (isAdminUser) {
      return NextResponse.json(
        { error: "Admin profile supports password update only" },
        { status: 403 },
      );
    }

    const normalizedEmail = normalizeEmail(String(body.email || ""));
    const normalizedName = String(body.name || "").trim();

    if (!normalizedName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 },
      );
    }

    const currentEmail = normalizeEmail(String(user.email || ""));
    const emailChanged = normalizedEmail !== currentEmail;
    const currentName = String(user.name || "").trim();
    const nameChanged = normalizedName !== currentName;

    if (
      emailChanged &&
      isPrimaryAdminEmail(user.email || user.username || "")
    ) {
      return NextResponse.json(
        { error: "Primary admin email cannot be modified" },
        { status: 403 },
      );
    }

    if (emailChanged && user.firebaseUid) {
      try {
        await adminAuth.updateUser(user.firebaseUid, {
          email: normalizedEmail,
        });
      } catch (error) {
        const firebaseError = error as { code?: string };
        if (firebaseError.code === "auth/email-already-exists") {
          return NextResponse.json(
            { error: "Email is already in use" },
            { status: 400 },
          );
        }

        console.error("Failed to sync Firebase email update:", error);
        return NextResponse.json(
          {
            error:
              "Failed to sync email with authentication service. Please try again.",
          },
          { status: 502 },
        );
      }
    }

    dbStart = Date.now();
    const updatedUser = await updateUserById(userId, {
      name: normalizedName,
      email: normalizedEmail,
      phone: String(body.phone || "").trim(),
      experience: String(body.experience || "").trim(),
    });
    dbDurationMs += Date.now() - dbStart;

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...safeUser } = updatedUser;

    if (nameChanged) {
      try {
        await createAdminNotification({
          type: "info",
          message: `Faculty ${currentName || user.username || userId} changed name to ${normalizedName}.`,
          userId,
        });
      } catch (notificationError) {
        // Profile update should succeed even if notification persistence fails.
        console.error(
          "Admin notification create error during profile update:",
          notificationError,
        );
      }
    }

    invalidateCachedProfile(`profile:${userId}`);
    setCachedProfile(`profile:${userId}`, safeUser, 60_000);

    const totalDurationMs = Date.now() - requestStart;
    if (totalDurationMs > 1200) {
      console.warn("Slow profile PATCH", {
        userId,
        totalDurationMs,
        dbDurationMs,
      });
    }

    return NextResponse.json(
      { user: safeUser },
      {
        headers: buildTimingResponseHeaders([
          {
            name: "db",
            durationMs: dbDurationMs,
            description: "profile-update",
          },
          { name: "total", durationMs: totalDurationMs },
        ]),
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "PRIMARY_ADMIN_LOCKED" ||
        error.message === "PRIMARY_ADMIN_IDENTITY_RESERVED"
      ) {
        return NextResponse.json(
          { error: "Primary admin profile cannot be modified" },
          { status: 403 },
        );
      }

      if (error.message === "DUPLICATE_USER") {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 },
        );
      }
    }

    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
