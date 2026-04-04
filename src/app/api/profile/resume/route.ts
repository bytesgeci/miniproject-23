import { NextRequest, NextResponse } from "next/server";
import { findUserById, updateUserById } from "@/lib/userStore";
import { invalidateCachedProfile, setCachedProfile } from "@/lib/profileCache";

export const runtime = "nodejs";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const FALLBACK_MIME_TYPES = new Set(["", "application/octet-stream"]);

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
    const resume = formData.get("resume");

    if (!userId) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 },
      );
    }

    if (!(resume instanceof File)) {
      return NextResponse.json(
        { error: "Resume file is required" },
        { status: 400 },
      );
    }

    const extension = getFileExtension(resume.name);
    const mimeType = String(resume.type || "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: "Only PDF, DOC, or DOCX files are allowed" },
        { status: 400 },
      );
    }

    if (
      !ALLOWED_MIME_TYPES.has(mimeType) &&
      !FALLBACK_MIME_TYPES.has(mimeType)
    ) {
      return NextResponse.json(
        { error: "Only PDF, DOC, or DOCX files are allowed" },
        { status: 400 },
      );
    }

    if (resume.size > MAX_RESUME_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Resume size should be less than 5MB" },
        { status: 400 },
      );
    }

    const user = await findUserById(userId);
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

    const resumeUrl = await fileToDataUrl(resume);
    const updatedUser = await updateUserById(userId, {
      resumeUrl,
      resumeFileName: resume.name,
      resumeUpdatedAt: new Date().toISOString(),
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
        resumeUrl,
        resumeFileName: resume.name,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 },
    );
  }
}
