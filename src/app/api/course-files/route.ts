import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/jsonDb";
import type { CourseFile } from "@/components/CourseFileManager/types";
import { recomputeEngagementForFaculty } from "@/lib/engagements";
import { saveDataUrlAsFile } from "@/lib/fileUpload";
import { getAllUsers } from "@/lib/userStore";
import type { UserRecord } from "@/lib/userStore";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { buildTimingResponseHeaders } from "@/lib/serverTiming";
import { isValidBatchYear, normalizeBatchYear } from "@/lib/batchYear";

// Force Node.js runtime for file system operations
export const runtime = "nodejs";
const MAX_DATA_URL_UPLOAD_BYTES = 5 * 1024 * 1024;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function toBooleanFlag(value: string | null, fallback: boolean) {
  if (value === null) {
    return fallback;
  }
  return value !== "0" && value.toLowerCase() !== "false";
}

function normalizeIdentity(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function buildUserIdentitySet(user: {
  id?: UserRecord["id"];
  username?: UserRecord["username"];
  email?: UserRecord["email"];
  firebaseUid?: UserRecord["firebaseUid"];
}) {
  const identities = new Set<string>();
  [user.id, user.username, user.email, user.firebaseUid].forEach((value) => {
    const normalized = normalizeIdentity(value);
    if (normalized) {
      identities.add(normalized);
    }
  });
  return identities;
}

function resolveUserByAnyIdentity(users: UserRecord[], value: unknown) {
  const lookup = normalizeIdentity(value);
  if (!lookup) {
    return null;
  }

  return (
    users.find((user) => {
      const identities = buildUserIdentitySet({
        id: user.id,
        username: user.username,
        email: user.email,
        firebaseUid: user.firebaseUid,
      });
      return identities.has(lookup);
    }) ?? null
  );
}

function estimateDataUrlBytes(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return 0;
  }

  const base64Payload = dataUrl.slice(commaIndex + 1).trim();
  if (!base64Payload) {
    return 0;
  }

  const padding = base64Payload.endsWith("==")
    ? 2
    : base64Payload.endsWith("=")
      ? 1
      : 0;
  return Math.floor((base64Payload.length * 3) / 4) - padding;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const academicYear = normalizeBatchYear(payload.academicYear);

    // Validate required fields
    if (!payload.courseCode) {
      return NextResponse.json(
        { error: "Course code is required" },
        { status: 400 },
      );
    }

    if (!payload.fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 },
      );
    }

    if (!isValidBatchYear(academicYear)) {
      return NextResponse.json(
        { error: "Batch must be in YYYY-YYYY format (for example 2022-2026)" },
        { status: 400 },
      );
    }

    const files = await readJsonFile<CourseFile[]>("courseFiles.json");
    const users = await getAllUsers();
    const facultyUser = resolveUserByAnyIdentity(users, payload.facultyId);
    const canonicalFacultyId = String(
      facultyUser?.id ?? payload.facultyId ?? "",
    ).trim();
    const facultyIdentitySet = facultyUser
      ? buildUserIdentitySet({
          id: facultyUser.id,
          username: facultyUser.username,
          email: facultyUser.email,
          firebaseUid: facultyUser.firebaseUid,
        })
      : new Set([normalizeIdentity(payload.facultyId)]);
    const timestamp = new Date().toISOString();

    // Validate and keep data URL; persisted via Mongo-backed jsonDb writer.
    let documentUrl = payload.documentUrl;
    if (payload.documentUrl && payload.documentUrl.startsWith("data:")) {
      const estimatedBytes = estimateDataUrlBytes(payload.documentUrl);
      if (estimatedBytes <= 0) {
        return NextResponse.json(
          { error: "Invalid uploaded file data" },
          { status: 400 },
        );
      }

      if (estimatedBytes > MAX_DATA_URL_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            error:
              "File too large. Maximum supported upload size is 5MB for MongoDB storage.",
          },
          { status: 413 },
        );
      }

      try {
        documentUrl = await saveDataUrlAsFile(
          payload.courseCode,
          payload.fileName,
          payload.documentUrl,
        );
      } catch (error) {
        console.error("Error processing file payload:", error);
        return NextResponse.json(
          { error: "Failed to process uploaded file data" },
          { status: 400 },
        );
      }
    }

    const newFile: CourseFile = {
      id: Date.now().toString(),
      facultyId: canonicalFacultyId,
      fileName: payload.fileName,
      documentUrl: documentUrl,
      courseCode: payload.courseCode,
      courseName: payload.courseName,
      fileType: payload.fileType,
      uploadDate: payload.uploadDate,
      semester: payload.semester,
      academicYear,
      size: payload.size,
      status: payload.status ?? "Pending",
      facultyName: facultyUser?.name ?? payload.facultyName,
      department: facultyUser?.department ?? payload.department,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Check for a duplicate: same facultyId + courseCode + fileType + academicYear
    const duplicateIndex = files.findIndex(
      (f) =>
        facultyIdentitySet.has(normalizeIdentity(f.facultyId)) &&
        f.courseCode === payload.courseCode &&
        f.fileType === payload.fileType &&
        normalizeBatchYear(f.academicYear) === academicYear,
    );

    let updatedFiles: CourseFile[];
    if (duplicateIndex !== -1) {
      // Delete the old file from disk if it exists
      const oldFile = files[duplicateIndex];
      if (oldFile.auditChecklistStatus === "yes") {
        return NextResponse.json(
          {
            error:
              "This file type is checklist-approved by the auditor and cannot be replaced.",
          },
          { status: 403 },
        );
      }
      if (oldFile.documentUrl && oldFile.documentUrl.startsWith("/uploads/")) {
        const oldFilePath = join(process.cwd(), "public", oldFile.documentUrl);
        if (existsSync(oldFilePath)) {
          try {
            await unlink(oldFilePath);
          } catch {
            // Non-fatal: proceed even if old file can't be removed
          }
        }
      }
      // Replace in place; preserve original id and createdAt
      const replacedFile: CourseFile = {
        ...newFile,
        id: oldFile.id,
        createdAt: oldFile.createdAt,
      };
      updatedFiles = [...files];
      updatedFiles[duplicateIndex] = replacedFile;
    } else {
      updatedFiles = [newFile, ...files];
    }

    try {
      console.log("Writing to courseFiles.json...");
      await writeJsonFile("courseFiles.json", updatedFiles);
      console.log("courseFiles.json updated successfully");
    } catch (error) {
      console.error("Error writing courseFiles.json:", error);
      return NextResponse.json(
        { error: "Failed to save file metadata" },
        { status: 500 },
      );
    }

    // Recompute engagement after file upload
    if (canonicalFacultyId) {
      try {
        console.log(
          `Recomputing engagement for faculty: ${canonicalFacultyId}`,
        );
        await recomputeEngagementForFaculty(canonicalFacultyId);
        console.log("Engagement recomputed successfully");
      } catch (error) {
        console.error("Error recomputing engagement:", error);
        // Don't fail the upload if engagement computation fails
        // The file is already saved and added to the database
      }
    }

    return NextResponse.json({ files: updatedFiles });
  } catch (error) {
    console.error("Course file create error:", error);
    return NextResponse.json(
      { error: "Failed to create course file" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const requestStart = Date.now();
  let readDurationMs = 0;
  let filterDurationMs = 0;
  let joinDurationMs = 0;

  try {
    const searchParams = request.nextUrl.searchParams;
    const facultyId = String(searchParams.get("facultyId") || "").trim();
    const status = String(searchParams.get("status") || "").trim();
    const academicYear = normalizeBatchYear(
      String(searchParams.get("academicYear") || "").trim(),
    );
    const search = String(searchParams.get("search") || "")
      .trim()
      .toLowerCase();
    const limit = parsePositiveInt(searchParams.get("limit"), 0);
    const offset = parsePositiveInt(searchParams.get("offset"), 0);
    const includeMeta = toBooleanFlag(searchParams.get("includeMeta"), true);
    const includeFaculty = toBooleanFlag(
      searchParams.get("includeFaculty"),
      true,
    );
    const requestedFields = String(searchParams.get("fields") || "")
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    const readStart = Date.now();
    const files = await readJsonFile<CourseFile[]>("courseFiles.json");
    readDurationMs += Date.now() - readStart;

    const users = await getAllUsers();
    const requestedFacultyUser = facultyId
      ? resolveUserByAnyIdentity(users, facultyId)
      : null;
    const facultyIdentitySet = requestedFacultyUser
      ? buildUserIdentitySet({
          id: requestedFacultyUser.id,
          username: requestedFacultyUser.username,
          email: requestedFacultyUser.email,
          firebaseUid: requestedFacultyUser.firebaseUid,
        })
      : new Set<string>();

    if (!requestedFacultyUser && facultyId) {
      const normalizedRequested = normalizeIdentity(facultyId);
      if (normalizedRequested) {
        facultyIdentitySet.add(normalizedRequested);
      }
    }

    const filterStart = Date.now();
    const filteredFiles = files.filter((file) => {
      if (facultyId) {
        const fileFacultyIdentity = normalizeIdentity(file.facultyId);
        if (
          !fileFacultyIdentity ||
          !facultyIdentitySet.has(fileFacultyIdentity)
        ) {
          return false;
        }
      }

      if (status && String(file.status || "") !== status) {
        return false;
      }

      if (
        academicYear &&
        normalizeBatchYear(String(file.academicYear || "")) !== academicYear
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        file.fileName,
        file.courseCode,
        file.courseName,
        file.facultyName,
        file.department,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
    filterDurationMs = Date.now() - filterStart;

    const hasFieldProjection = requestedFields.length > 0;
    const projectionFields = hasFieldProjection
      ? new Set(["id", ...requestedFields])
      : null;

    const projectedFiles = hasFieldProjection
      ? filteredFiles.map((file) => {
          const projected: Record<string, unknown> = {};
          projectionFields?.forEach((field) => {
            const key = field as keyof CourseFile;
            if (key in file) {
              projected[key] = file[key];
            }
          });
          return projected as unknown as CourseFile;
        })
      : filteredFiles;

    const pagedFiles =
      limit > 0
        ? projectedFiles.slice(offset, offset + limit)
        : projectedFiles.slice(offset);

    let filesWithFaculty = pagedFiles;
    if (includeFaculty) {
      const joinStart = Date.now();
      const userByIdentity = new Map<string, (typeof users)[number]>();
      for (const user of users) {
        const identities = buildUserIdentitySet({
          id: user.id,
          username: user.username,
          email: user.email,
          firebaseUid: user.firebaseUid,
        });
        identities.forEach((identity) => {
          userByIdentity.set(identity, user);
        });
      }

      filesWithFaculty = pagedFiles.map((file) => {
        const facultyUser = file.facultyId
          ? userByIdentity.get(normalizeIdentity(file.facultyId))
          : null;
        return {
          ...file,
          facultyName: facultyUser?.name ?? file.facultyName,
          department: facultyUser?.department ?? file.department,
        };
      });
      joinDurationMs = Date.now() - joinStart;
    }

    const responsePayload: {
      files: CourseFile[];
      total: number;
      offset: number;
      limit: number;
      fileCategories?: string[];
      fileTypes?: string[];
    } = {
      files: filesWithFaculty,
      total: filteredFiles.length,
      offset,
      limit,
    };

    if (includeMeta) {
      const [fileCategories, fileTypes] = await Promise.all([
        readJsonFile<string[]>("files/course-file-categories.json"),
        readJsonFile<string[]>("files/course-file-types.json"),
      ]);
      responsePayload.fileCategories = fileCategories;
      responsePayload.fileTypes = fileTypes;
    }

    const totalDurationMs = Date.now() - requestStart;
    if (totalDurationMs > 1500) {
      console.warn("Slow course-files GET", {
        totalDurationMs,
        readDurationMs,
        filterDurationMs,
        joinDurationMs,
        limit,
        offset,
      });
    }

    return NextResponse.json(responsePayload, {
      headers: buildTimingResponseHeaders(
        [
          {
            name: "read",
            durationMs: readDurationMs,
            description: "read-json",
          },
          {
            name: "filter",
            durationMs: filterDurationMs,
            description: "filter-search",
          },
          {
            name: "join",
            durationMs: joinDurationMs,
            description: "user-lookup",
          },
          { name: "total", durationMs: totalDurationMs },
        ],
        {
          "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
        },
      ),
    });
  } catch (error) {
    console.error("Course file load error:", error);
    return NextResponse.json(
      { error: "Failed to load course files" },
      { status: 500 },
    );
  }
}
