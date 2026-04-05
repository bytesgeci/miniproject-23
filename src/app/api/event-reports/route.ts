import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongoDb";
import { COLLECTIONS, ensureNormalizedIndexes } from "@/lib/mongoNormalized";
import type { EventReport } from "@/components/EventReportManager/types";
import { getAllUsers } from "@/lib/userStore";
import type { UserRecord } from "@/lib/userStore";

type EventReportWithFaculty = EventReport & {
  facultyName?: string;
  department?: string;
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
    const db = await getMongoDb();
    // Avoid blocking user-facing writes on index checks.
    void ensureNormalizedIndexes(db).catch((error) => {
      console.warn("Background index ensure failed for event-reports POST", {
        message: error instanceof Error ? error.message : String(error),
      });
    });
    const payload = await request.json();
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

    await db
      .collection<
        EventReport & { facultyName?: string }
      >(COLLECTIONS.eventReports)
      .insertOne(newReport);

    const updatedReports = (await db
      .collection<EventReport>(COLLECTIONS.eventReports)
      .find({})
      .sort({ createdAt: -1 })
      .toArray()) as EventReport[];

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
    const db = await getMongoDb();
    // Keep reads fast on cold starts; ensure indexes in background.
    void ensureNormalizedIndexes(db).catch((error) => {
      console.warn("Background index ensure failed for event-reports GET", {
        message: error instanceof Error ? error.message : String(error),
      });
    });
    const reportsCollection = db.collection<EventReport>(
      COLLECTIONS.eventReports,
    );

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

    let users: UserRecord[] = [];
    let requestedFacultyUser: UserRecord | null = null;
    const facultyIdentitySet = new Set<string>();

    const query: Record<string, unknown> = {};
    if (facultyId) {
      // Fast path: exact facultyId match first; fallback to identity expansion only if needed.
      query.facultyId = facultyId;
    }
    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }
    if (community) {
      query.community = new RegExp(`^${community}$`, "i");
    }

    // Fast path for faculty dashboard loads (no search text): let MongoDB filter/paginate.
    if (!search) {
      let activeQuery = { ...query };
      let total = await reportsCollection.countDocuments(activeQuery);

      if (facultyId && total === 0) {
        users = await getAllUsers();
        requestedFacultyUser = resolveUserByAnyIdentity(users, facultyId);

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

        if (facultyIdentitySet.size > 0) {
          activeQuery = {
            ...activeQuery,
            facultyId: { $in: Array.from(facultyIdentitySet) },
          };
          total = await reportsCollection.countDocuments(activeQuery);
        }
      }

      let cursor = reportsCollection.find(activeQuery).sort({ createdAt: -1 });
      if (offset > 0) {
        cursor = cursor.skip(offset);
      }
      if (limit > 0) {
        cursor = cursor.limit(limit);
      }

      const pagedReports = (await cursor.toArray()) as EventReportWithFaculty[];

      // Most records now store facultyName/department at write-time.
      // Only enrich when fields are missing.
      const needsEnrichment = pagedReports.some(
        (report) => !report.facultyName || !report.department,
      );

      let reportsWithFaculty = pagedReports as EventReportWithFaculty[];

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

      if (!includeMeta) {
        return NextResponse.json({
          reports: reportsWithFaculty,
          total,
          offset,
          limit,
        });
      }

      const communities = (await reportsCollection.distinct("community"))
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      return NextResponse.json({
        reports: reportsWithFaculty,
        communities,
        total,
        offset,
        limit,
      });
    }

    let reportsQuery = { ...query };
    let reports = (await reportsCollection
      .find(reportsQuery)
      .sort({ createdAt: -1 })
      .toArray()) as EventReportWithFaculty[];

    if (facultyId && reports.length === 0) {
      users = await getAllUsers();
      requestedFacultyUser = resolveUserByAnyIdentity(users, facultyId);

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

      if (facultyIdentitySet.size > 0) {
        reportsQuery = {
          ...reportsQuery,
          facultyId: { $in: Array.from(facultyIdentitySet) },
        };
        reports = (await reportsCollection
          .find(reportsQuery)
          .sort({ createdAt: -1 })
          .toArray()) as EventReportWithFaculty[];
      }
    }

    const filteredReports = reports.filter((report) => {
      if (facultyIdentitySet.size > 0) {
        const reportFacultyIdentity = normalizeIdentity(report.facultyId);
        if (
          !reportFacultyIdentity ||
          !facultyIdentitySet.has(reportFacultyIdentity)
        ) {
          return false;
        }
      }

      if (status && String(report.status || "").toLowerCase() !== status) {
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

    const pagedReports =
      limit > 0
        ? filteredReports.slice(offset, offset + limit)
        : filteredReports.slice(offset);

    if (users.length === 0) {
      users = await getAllUsers();
    }

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

    const reportsWithFaculty = pagedReports.map((report) => {
      const facultyUser = userByIdentity.get(
        normalizeIdentity(report.facultyId),
      );
      return {
        ...report,
        facultyName: facultyUser?.name,
        department: facultyUser?.department ?? report.department,
      };
    });

    if (!includeMeta) {
      return NextResponse.json({
        reports: reportsWithFaculty,
        total: filteredReports.length,
        offset,
        limit,
      });
    }

    const communities = (await reportsCollection.distinct("community"))
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({
      reports: reportsWithFaculty,
      communities,
      total: filteredReports.length,
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
