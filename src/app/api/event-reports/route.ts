import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/jsonDb";
import type { EventReport } from "@/components/EventReportManager/types";
import { getAllUsers } from "@/lib/userStore";
import type { UserRecord } from "@/lib/userStore";
import { recomputeEngagementForFaculty } from "@/lib/engagements";

type EventReportWithFaculty = EventReport & {
  facultyName?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
};

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

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const reports =
      await readJsonFile<EventReportWithFaculty[]>("eventReports.json");
    const users = await getAllUsers();
    const facultyUser = resolveUserByAnyIdentity(users, payload.facultyId);
    const canonicalFacultyId = String(
      facultyUser?.id ?? payload.facultyId ?? "",
    ).trim();
    const timestamp = new Date().toISOString();

    const newReport: EventReport & { facultyName?: string } = {
      id: randomUUID(),
      facultyId: canonicalFacultyId,
      eventName: payload.eventName,
      community: payload.community,
      eventDate: payload.eventDate,
      description: payload.description,
      location: payload.location,
      participants: payload.participants,
      duration: payload.duration,
      objectives: payload.objectives,
      outcomes: payload.outcomes,
      thumbnailUrl: payload.thumbnailUrl,
      galleryImages: payload.galleryImages,
      status: payload.status ?? "Draft",
      submittedDate: payload.submittedDate,
      facultyCoordinator: payload.facultyCoordinator,
      department: facultyUser?.department ?? payload.department,
      facultyName: facultyUser?.name,
      eventType: payload.eventType,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const updatedReports = [newReport, ...(reports || [])];
    await writeJsonFile("eventReports.json", updatedReports);

    if (canonicalFacultyId) {
      try {
        await recomputeEngagementForFaculty(canonicalFacultyId);
      } catch (error) {
        console.warn("Failed to recompute engagement after report create", {
          facultyId: canonicalFacultyId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({ reports: updatedReports });
  } catch (error) {
    console.error("Event report create error:", error);
    return NextResponse.json(
      { error: "Failed to create event report" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const reports =
      await readJsonFile<EventReportWithFaculty[]>("eventReports.json");

    const searchParams = request.nextUrl.searchParams;
    const facultyId = String(searchParams.get("facultyId") || "").trim();
    const status = String(searchParams.get("status") || "")
      .trim()
      .toLowerCase();
    const community = String(searchParams.get("community") || "")
      .trim()
      .toLowerCase();
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

    let users: UserRecord[] = [];
    const facultyIdentitySet = new Set<string>();

    // Fast path: direct facultyId filtering first, like course-files route.
    let filteredReports = (reports || []).filter((report) => {
      if (facultyId && String(report.facultyId || "").trim() !== facultyId) {
        return false;
      }
      if (
        status &&
        String(report.status || "")
          .trim()
          .toLowerCase() !== status
      ) {
        return false;
      }
      if (
        community &&
        String(report.community || "")
          .trim()
          .toLowerCase() !== community
      ) {
        return false;
      }
      if (!search) {
        return true;
      }

      const haystack = [
        report.eventName,
        report.community,
        report.description,
        report.location,
        report.facultyCoordinator,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });

    // Identity fallback only if a faculty filter was given and direct match is empty.
    if (facultyId && filteredReports.length === 0) {
      users = await getAllUsers();
      const requestedFacultyUser = resolveUserByAnyIdentity(users, facultyId);

      if (requestedFacultyUser) {
        const identities = buildUserIdentitySet({
          id: requestedFacultyUser.id,
          username: requestedFacultyUser.username,
          email: requestedFacultyUser.email,
          firebaseUid: requestedFacultyUser.firebaseUid,
        });
        identities.forEach((identity) => facultyIdentitySet.add(identity));
      } else {
        const normalizedRequested = normalizeIdentity(facultyId);
        if (normalizedRequested) {
          facultyIdentitySet.add(normalizedRequested);
        }
      }

      filteredReports = (reports || []).filter((report) => {
        if (facultyIdentitySet.size > 0) {
          const reportFacultyIdentity = normalizeIdentity(report.facultyId);
          if (
            !reportFacultyIdentity ||
            !facultyIdentitySet.has(reportFacultyIdentity)
          ) {
            return false;
          }
        }

        if (
          status &&
          String(report.status || "")
            .trim()
            .toLowerCase() !== status
        ) {
          return false;
        }
        if (
          community &&
          String(report.community || "")
            .trim()
            .toLowerCase() !== community
        ) {
          return false;
        }
        if (!search) {
          return true;
        }

        const haystack = [
          report.eventName,
          report.community,
          report.description,
          report.location,
          report.facultyCoordinator,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    const sortedReports = filteredReports.slice().sort((a, b) => {
      const aTime = new Date(a.createdAt || a.eventDate || 0).getTime();
      const bTime = new Date(b.createdAt || b.eventDate || 0).getTime();
      return bTime - aTime;
    });

    const pagedReports =
      limit > 0
        ? sortedReports.slice(offset, offset + limit)
        : sortedReports.slice(offset);

    let reportsWithFaculty = pagedReports;
    if (includeFaculty) {
      const needsEnrichment = pagedReports.some(
        (report) => !report.facultyName || !report.department,
      );

      if (needsEnrichment) {
        if (users.length === 0) {
          users = await getAllUsers();
        }

        const userByIdentity = new Map<string, UserRecord>();
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

        reportsWithFaculty = pagedReports.map((report) => {
          const facultyUser = userByIdentity.get(
            normalizeIdentity(report.facultyId),
          );
          return {
            ...report,
            facultyName: report.facultyName || facultyUser?.name,
            department: report.department || facultyUser?.department,
          };
        });
      }
    }

    if (!includeMeta) {
      return NextResponse.json({
        reports: reportsWithFaculty,
        total: sortedReports.length,
        offset,
        limit,
      });
    }

    const configuredCommunities = await readJsonFile<string[]>(
      "reports/communities.json",
    );
    const communities = Array.from(
      new Set([
        ...(configuredCommunities || []),
        ...sortedReports.map((report) => String(report.community || "")),
      ]),
    )
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      reports: reportsWithFaculty,
      communities,
      total: sortedReports.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error("Event report load error:", error);
    return NextResponse.json(
      { error: "Failed to load event reports" },
      { status: 500 },
    );
  }
}
