import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongoDb";
import { COLLECTIONS, ensureNormalizedIndexes } from "@/lib/mongoNormalized";
import type { EventReport } from "@/components/EventReportManager/types";
import { getAllUsers } from "@/lib/userStore";

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

export async function POST(request: NextRequest) {
  try {
    const db = await getMongoDb();
    await ensureNormalizedIndexes(db);
    const payload = await request.json();
    const users = await getAllUsers();
    const facultyUser = users.find((user) => user.id === payload.facultyId);
    const timestamp = new Date().toISOString();

    const newReport: EventReport & { facultyName?: string } = {
      id: randomUUID(),
      facultyId: payload.facultyId,
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
    await ensureNormalizedIndexes(db);
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

    const query: Record<string, unknown> = {};
    if (facultyId) {
      query.facultyId = facultyId;
    }
    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }
    if (community) {
      query.community = new RegExp(`^${community}$`, "i");
    }

    const reports = (await db
      .collection<EventReport>(COLLECTIONS.eventReports)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()) as EventReport[];
    const users = await getAllUsers();
    const filteredReports = reports.filter((report) => {
      if (facultyId && String(report.facultyId || "") !== facultyId) {
        return false;
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

    const userById = new Map(users.map((user) => [user.id, user]));
    const reportsWithFaculty = pagedReports.map((report) => {
      const facultyUser = userById.get(String(report.facultyId || ""));
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

    const communities = (
      await db
        .collection<EventReport>(COLLECTIONS.eventReports)
        .distinct("community")
    )
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
