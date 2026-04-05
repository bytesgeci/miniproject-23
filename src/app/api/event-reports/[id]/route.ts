import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/jsonDb";
import type { EventReport } from "@/components/EventReportManager/types";
import { recomputeEngagementForFaculty } from "@/lib/engagements";

type EventReportWithMeta = EventReport & {
  createdAt?: string;
  updatedAt?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const reports =
      await readJsonFile<EventReportWithMeta[]>("eventReports.json");
    const updatedAt = new Date().toISOString();

    const updatedReports = reports.map((report) =>
      report.id === id
        ? {
            ...report,
            ...payload,
            responseDate: payload.facultyResponse
              ? new Date().toISOString().split("T")[0]
              : report.responseDate,
            updatedAt,
          }
        : report,
    );

    await writeJsonFile("eventReports.json", updatedReports);
    return NextResponse.json({ reports: updatedReports });
  } catch (error) {
    console.error("Event report update error:", error);
    return NextResponse.json(
      { error: "Failed to update event report" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const reports =
      await readJsonFile<EventReportWithMeta[]>("eventReports.json");
    const reportToDelete = reports.find((report) => report.id === id);
    const updatedReports = reports.filter((report) => report.id !== id);

    const audits = await readJsonFile<
      {
        id: string;
        entityType: string;
        entityId: string;
      }[]
    >("audits.json");
    const remarks = await readJsonFile<
      {
        id: string;
        entityType: string;
        entityId: string;
      }[]
    >("remarks.json");

    const updatedAudits = audits.filter(
      (audit) =>
        !(audit.entityType === "event-report" && audit.entityId === id),
    );
    const updatedRemarks = remarks.filter(
      (remark) =>
        !(remark.entityType === "event-report" && remark.entityId === id),
    );

    await writeJsonFile("eventReports.json", updatedReports);
    await writeJsonFile("audits.json", updatedAudits);
    await writeJsonFile("remarks.json", updatedRemarks);

    if (reportToDelete?.facultyId) {
      try {
        await recomputeEngagementForFaculty(String(reportToDelete.facultyId));
      } catch (error) {
        console.warn("Failed to recompute engagement after report delete", {
          facultyId: reportToDelete.facultyId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({ reports: updatedReports });
  } catch (error) {
    console.error("Event report delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete event report" },
      { status: 500 },
    );
  }
}
