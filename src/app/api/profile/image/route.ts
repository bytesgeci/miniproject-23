import { NextRequest, NextResponse } from "next/server";
import { findUserById, updateUserById } from "@/lib/userStore";
import { invalidateCachedProfile, setCachedProfile } from "@/lib/profileCache";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const FALLBACK_MIME_TYPES = new Set(["", "application/octet-stream"]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index < 0) {
    return "";
  }
  return fileName.slice(index).toLowerCase();
}

async function fileToDataUrl(file: File) {
  const bytes = await file.arrayBuffer();
  const mimeType = String(
    file.type || "application/octet-stream",
  ).toLowerCase();
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = String(formData.get("userId") || "").trim();
    const image = formData.get("image");

    if (!userId) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 },
      );
    }

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Profile image file is required" },
        { status: 400 },
      );
    }

    const extension = getFileExtension(image.name);
    const mimeType = String(image.type || "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, JPEG, WEBP, or GIF files are allowed" },
        { status: 400 },
      );
    }

    if (
      !ALLOWED_MIME_TYPES.has(mimeType) &&
      !FALLBACK_MIME_TYPES.has(mimeType)
    ) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Profile image size should be less than 3MB" },
        { status: 400 },
      );
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const safeFileName = sanitizeFileName(image.name);
    const profileImageUrl = await fileToDataUrl(image);

    const updatedUser = await updateUserById(userId, {
      profileImageUrl,
      profileImageFileName: safeFileName,
      profileImageUpdatedAt: new Date().toISOString(),
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...safeUser } = updatedUser;
    invalidateCachedProfile(`profile:${userId}`);
    setCachedProfile(`profile:${userId}`, safeUser, 60_000);

    return NextResponse.json(
      {
        user: safeUser,
        profileImageUrl,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload profile image" },
      { status: 500 },
    );
  }
}
