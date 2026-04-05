import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/jsonDb";
import type { CourseFile } from "@/components/CourseFileManager/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const files = await readJsonFile<CourseFile[]>("courseFiles.json");
    const file = files.find((item) => item.id === id);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error("Course file get-by-id error:", error);
    return NextResponse.json(
      { error: "Failed to load course file" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const files = await readJsonFile<CourseFile[]>("courseFiles.json");
    const updatedAt = new Date().toISOString();

    const updatedFiles = files.map((file) =>
      file.id === id
        ? {
            ...file,
            ...payload,
            responseDate: payload.facultyResponse
              ? new Date().toISOString().split("T")[0]
              : file.responseDate,
            updatedAt,
          }
        : file,
    );

    await writeJsonFile("courseFiles.json", updatedFiles);

    return NextResponse.json({ files: updatedFiles });
  } catch (error) {
    console.error("Course file update error:", error);
    return NextResponse.json(
      { error: "Failed to update course file" },
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
    const files = await readJsonFile<CourseFile[]>("courseFiles.json");
    const fileToDelete = files.find((file) => file.id === id);

    if (fileToDelete?.auditChecklistStatus === "yes") {
      return NextResponse.json(
        {
          error:
            "This file is checklist-approved by the auditor and cannot be deleted.",
        },
        { status: 403 },
      );
    }

    const updatedFiles = files.filter((file) => file.id !== id);
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
      (audit) => !(audit.entityType === "course-file" && audit.entityId === id),
    );
    const updatedRemarks = remarks.filter(
      (remark) =>
        !(remark.entityType === "course-file" && remark.entityId === id),
    );

    await writeJsonFile("courseFiles.json", updatedFiles);
    await writeJsonFile("audits.json", updatedAudits);
    await writeJsonFile("remarks.json", updatedRemarks);
    return NextResponse.json({ files: updatedFiles });
  } catch (error) {
    console.error("Course file delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete course file" },
      { status: 500 },
    );
  }
}
