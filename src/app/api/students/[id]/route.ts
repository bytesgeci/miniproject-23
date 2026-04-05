import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongoDb";
import { COLLECTIONS, ensureNormalizedIndexes } from "@/lib/mongoNormalized";
import type { Student } from "@/components/StaffAdvisorDashboard/types";
import { resolveStaffAdvisorScope } from "@/lib/staffAdvisorScope";
import { isValidBatchYear, normalizeBatchYear } from "@/lib/batchYear";
import { apiCache } from "@/lib/apiCache";
import { clearDashboardCache } from "@/lib/dashboardData";

const VALID_SEMESTERS = new Set([
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
]);

function normalizeSemesterInput(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  const match = raw.toUpperCase().match(/^(?:SEMESTER|SEM|S)?\s*([1-8])$/);
  return match ? `S${match[1]}` : "";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = await getMongoDb();
    await ensureNormalizedIndexes(db);
    const advisorScope = await resolveStaffAdvisorScope(request);
    if (!advisorScope) {
      return NextResponse.json(
        { error: "Unauthorized staff advisor context" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const payload = await request.json();
    const updatedAt = new Date().toISOString();

    const existingStudent = await db
      .collection<Student>(COLLECTIONS.students)
      .findOne({ id });
    if (
      !existingStudent ||
      existingStudent.advisorId !== advisorScope.advisorId
    ) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (Object.prototype.hasOwnProperty.call(payload, "semester")) {
      const normalizedSemester = normalizeSemesterInput(payload.semester);
      if (!VALID_SEMESTERS.has(normalizedSemester)) {
        return NextResponse.json(
          { error: "Semester must be one of S1 to S8" },
          { status: 400 },
        );
      }
      payload.semester = normalizedSemester;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "batchYear")) {
      const normalizedBatchYear = normalizeBatchYear(payload.batchYear);
      if (!isValidBatchYear(normalizedBatchYear)) {
        return NextResponse.json(
          {
            error:
              "Batch year must follow YYYY-YYYY format (for example 2023-2027)",
          },
          { status: 400 },
        );
      }
      payload.batchYear = normalizedBatchYear;
    }

    const nextRollNumber = String(
      payload.rollNumber ?? existingStudent.rollNumber,
    ).trim();
    const nextBatchYear = normalizeBatchYear(
      payload.batchYear ?? existingStudent.batchYear,
    );

    const duplicateInAdvisorScope = await db
      .collection<Student>(COLLECTIONS.students)
      .findOne({
        id: { $ne: existingStudent.id },
        advisorId: advisorScope.advisorId,
        rollNumber: nextRollNumber,
        batchYear: nextBatchYear,
      });

    if (duplicateInAdvisorScope) {
      return NextResponse.json(
        { error: "Roll number already exists in this batch" },
        { status: 409 },
      );
    }

    const nextStudent: Student = {
      ...existingStudent,
      ...payload,
      advisorId: existingStudent.advisorId,
      updatedAt,
    } as Student;

    await db
      .collection<Student>(COLLECTIONS.students)
      .updateOne({ id }, { $set: nextStudent });

    apiCache.clear(`students:${advisorScope.advisorId}`);
    clearDashboardCache();

    return NextResponse.json({ student: nextStudent });
  } catch (error) {
    console.error("Student update error:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = await getMongoDb();
    await ensureNormalizedIndexes(db);
    const advisorScope = await resolveStaffAdvisorScope(request);
    if (!advisorScope) {
      return NextResponse.json(
        { error: "Unauthorized staff advisor context" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const existingStudent = await db
      .collection<Student>(COLLECTIONS.students)
      .findOne({ id });
    if (
      !existingStudent ||
      existingStudent.advisorId !== advisorScope.advisorId
    ) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await db
      .collection<Student>(COLLECTIONS.students)
      .deleteOne({ id, advisorId: advisorScope.advisorId });

    apiCache.clear(`students:${advisorScope.advisorId}`);
    clearDashboardCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 },
    );
  }
}
