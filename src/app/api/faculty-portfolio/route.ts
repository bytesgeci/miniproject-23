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

function normalizeIdForMatching(value: unknown) {
  const normalized = normalizeIdentity(value);
  if (!normalized) {
    return [] as string[];
  }

  const variants = new Set<string>([normalized]);

  // Handle legacy serialized ObjectId formats used by older records.
  variants.add(
    normalized.replace(/^objectid\(["']?/, "").replace(/["']?\)$/, ""),
  );
  variants.add(normalized.replace(/^\{"\$oid":"/, "").replace(/"\}$/, ""));

  return [...variants].filter(Boolean);
}

function buildUserIdentitySet(user: {
  id?: UserRecord["id"];
  username?: UserRecord["username"];
  email?: UserRecord["email"];
  firebaseUid?: UserRecord["firebaseUid"];
}) {
  const identities = new Set<string>();

  [user.id, user.username, user.email, user.firebaseUid].forEach((value) => {
    normalizeIdForMatching(value).forEach((variant) => identities.add(variant));
  });

  return identities;
}

function resolveUserByAnyIdentity(users: UserRecord[], value: unknown) {
  const lookupVariants = normalizeIdForMatching(value);
  if (lookupVariants.length === 0) {
    return null;
  }

  const lookupSet = new Set(lookupVariants);

  return (
    users.find((user) => {
      const identities = buildUserIdentitySet({
        id: user.id,
        username: user.username,
        email: user.email,
        firebaseUid: user.firebaseUid,
      });
      return [...identities].some((identity) => lookupSet.has(identity));
    }) ?? null
  );
}

function buildRecordIdentitySet(record: Record<string, unknown>) {
  const identities = new Set<string>();

  [
    record.facultyId,
    record.facultyID,
    record.uploadedBy,
    record.uploadedById,
    record.facultyEmail,
    record.email,
    record.username,
  ].forEach((value) => {
    normalizeIdForMatching(value).forEach((variant) => identities.add(variant));
  });

  return identities;
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
    const facultyUsername = String(
      searchParams.get("facultyUsername") || "",
    ).trim();
    const facultyEmail = String(searchParams.get("facultyEmail") || "").trim();
    const facultyName = String(searchParams.get("facultyName") || "").trim();
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
      : new Set<string>(normalizeIdForMatching(facultyId));

    normalizeIdForMatching(facultyUsername).forEach((variant) =>
      facultyIdentitySet.add(variant),
    );
    normalizeIdForMatching(facultyEmail).forEach((variant) =>
      facultyIdentitySet.add(variant),
    );

    const facultyNameSet = new Set<string>();
    const normalizedRequestedName = normalizeIdentity(facultyName);
    const normalizedResolvedName = normalizeIdentity(
      requestedFacultyUser?.name,
    );
    if (normalizedRequestedName) {
      facultyNameSet.add(normalizedRequestedName);
    }
    if (normalizedResolvedName) {
      facultyNameSet.add(normalizedResolvedName);
    }

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
      const recordIdentities = buildRecordIdentitySet(file);
      const byIdentity = [...recordIdentities].some((identity) =>
        facultyIdentitySet.has(identity),
      );
      if (byIdentity) {
        return true;
      }

      const recordFacultyName = normalizeIdentity(file.facultyName);
      return recordFacultyName ? facultyNameSet.has(recordFacultyName) : false;
    });

    const scopedReports = (reports || []).filter((report) => {
      const recordIdentities = buildRecordIdentitySet(report);
      const byIdentity = [...recordIdentities].some((identity) =>
        facultyIdentitySet.has(identity),
      );
      if (byIdentity) {
        return true;
      }

      const coordinatorName = normalizeIdentity(report.facultyCoordinator);
      const reportFacultyName = normalizeIdentity(report.facultyName);
      return (
        (coordinatorName && facultyNameSet.has(coordinatorName)) ||
        (reportFacultyName && facultyNameSet.has(reportFacultyName))
      );
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
