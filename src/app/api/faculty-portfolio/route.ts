import { NextRequest, NextResponse } from "next/server";
import { readJsonFile } from "@/lib/jsonDb";
import { getAllUsers } from "@/lib/userStore";
import type { UserRecord } from "@/lib/userStore";

type CourseFileRecord = Record<string, unknown>;
type EventReportRecord = Record<string, unknown>;

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

function projectRecord<T extends Record<string, unknown>>(
  record: T,
  fields: Set<string>,
) {
  const projected: Record<string, unknown> = {};

  fields.forEach((field) => {
    if (field in record) {
      projected[field] = record[field as keyof T];
    }
  });

  return projected;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facultyId = String(searchParams.get("facultyId") || "").trim();
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 40);
    const courseFilesPage = Math.max(
      1,
      parsePositiveInt(searchParams.get("courseFilesPage"), 1),
    );
    const eventReportsPage = Math.max(
      1,
      parsePositiveInt(searchParams.get("eventReportsPage"), 1),
    );

    if (!facultyId) {
      return NextResponse.json(
        { error: "facultyId is required" },
        { status: 400 },
      );
    }

    const [users, files, reports] = await Promise.all([
      getAllUsers(),
      readJsonFile<CourseFileRecord[]>("courseFiles.json"),
      readJsonFile<EventReportRecord[]>("eventReports.json"),
    ]);

    const requestedFacultyUser = resolveUserByAnyIdentity(users, facultyId);
    const facultyIdentitySet = requestedFacultyUser
      ? buildUserIdentitySet({
          id: requestedFacultyUser.id,
          username: requestedFacultyUser.username,
          email: requestedFacultyUser.email,
          firebaseUid: requestedFacultyUser.firebaseUid,
        })
      : new Set<string>([normalizeIdentity(facultyId)]);

    const fileProjection = new Set([
      "id",
      "facultyId",
      "fileName",
      "courseCode",
      "courseName",
      "fileType",
      "uploadDate",
      "semester",
      "academicYear",
      "status",
      "auditorRemarks",
      "auditChecklistStatus",
      "auditChecklistFinalized",
      "auditChecklistReport",
    ]);

    const reportProjection = new Set([
      "id",
      "facultyId",
      "eventName",
      "eventType",
      "eventDate",
      "location",
      "participants",
      "duration",
      "status",
      "facultyCoordinator",
      "community",
      "department",
      "description",
      "objectives",
      "outcomes",
    ]);

    const scopedFiles = (files || []).filter((file) => {
      const fileIdentity = normalizeIdentity(file.facultyId);
      return fileIdentity ? facultyIdentitySet.has(fileIdentity) : false;
    });

    const scopedReports = (reports || []).filter((report) => {
      const reportIdentity = normalizeIdentity(report.facultyId);
      return reportIdentity ? facultyIdentitySet.has(reportIdentity) : false;
    });

    const sortedFiles = scopedFiles.slice().sort((a, b) => {
      const aTime = new Date(
        String(a.createdAt || a.uploadDate || 0),
      ).getTime();
      const bTime = new Date(
        String(b.createdAt || b.uploadDate || 0),
      ).getTime();
      return bTime - aTime;
    });

    const sortedReports = scopedReports.slice().sort((a, b) => {
      const aTime = new Date(String(a.createdAt || a.eventDate || 0)).getTime();
      const bTime = new Date(String(b.createdAt || b.eventDate || 0)).getTime();
      return bTime - aTime;
    });

    const courseOffset = (courseFilesPage - 1) * pageSize;
    const reportOffset = (eventReportsPage - 1) * pageSize;

    const pagedFiles = sortedFiles.slice(courseOffset, courseOffset + pageSize);
    const pagedReports = sortedReports.slice(
      reportOffset,
      reportOffset + pageSize,
    );

    return NextResponse.json({
      files: pagedFiles.map((file) => projectRecord(file, fileProjection)),
      totalFiles: scopedFiles.length,
      reports: pagedReports.map((report) =>
        projectRecord(report, reportProjection),
      ),
      totalReports: scopedReports.length,
    });
  } catch (error) {
    console.error("Faculty portfolio load error:", error);
    return NextResponse.json(
      { error: "Failed to load faculty portfolio" },
      { status: 500 },
    );
  }
}
