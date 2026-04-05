import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongoDb";
import { COLLECTIONS, ensureNormalizedIndexes } from "@/lib/mongoNormalized";
import type { Student } from "@/components/StaffAdvisorDashboard/types";
import { resolveStaffAdvisorScope } from "@/lib/staffAdvisorScope";
import { isValidBatchYear, normalizeBatchYear } from "@/lib/batchYear";
import { createCachedResponse, apiCache } from "@/lib/apiCache";
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

export async function GET(request: NextRequest) {
  try {
    const db = await getMongoDb();
    await ensureNormalizedIndexes(db);
    const advisorScope = await resolveStaffAdvisorScope(request);
    if (!advisorScope) {
      return createCachedResponse({ students: [] }, { maxAge: 30 });
    }

    const cacheKey = `students:${advisorScope.advisorId}`;
    const cachedData = apiCache.get(cacheKey);

    if (cachedData) {
      return createCachedResponse(cachedData, { maxAge: 60 });
    }

    const scopedStudents = (await db
      .collection<Student>(COLLECTIONS.students)
      .find({ advisorId: advisorScope.advisorId })
      .sort({ createdAt: -1 })
      .toArray()) as Student[];

    const responseData = { students: scopedStudents };
    apiCache.set(cacheKey, responseData);

    return createCachedResponse(responseData, { maxAge: 60 });
  } catch (error) {
    console.error("Students load error:", error);
    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const payload = await request.json();
    const timestamp = new Date().toISOString();

    const rollNumber = String(payload.rollNumber ?? "").trim();
    const email = String(payload.email ?? "")
      .trim()
      .toLowerCase();
    const batchYear = normalizeBatchYear(payload.batchYear);
    const normalizedSemester = normalizeSemesterInput(payload.semester);

    if (!payload.name || !rollNumber || !email || !batchYear) {
      return NextResponse.json(
        { error: "Name, roll number, email, and batch year are required" },
        { status: 400 },
      );
    }

    if (payload.semester && !VALID_SEMESTERS.has(normalizedSemester)) {
      return NextResponse.json(
        { error: "Semester must be one of S1 to S8" },
        { status: 400 },
      );
    }

    if (!isValidBatchYear(batchYear)) {
      return NextResponse.json(
        {
          error:
            "Batch year must follow YYYY-YYYY format (for example 2023-2027)",
        },
        { status: 400 },
      );
    }

    const duplicateInAdvisorScope = await db
      .collection<Student>(COLLECTIONS.students)
      .findOne({
        advisorId: advisorScope.advisorId,
        batchYear,
        rollNumber,
      });

    if (duplicateInAdvisorScope) {
      return NextResponse.json(
        { error: "Roll number already exists in this batch" },
        { status: 409 },
      );
    }

    const newStudent: Student & { createdAt?: string; updatedAt?: string } = {
      id: randomUUID(),
      advisorId: advisorScope.advisorId,
      name: payload.name,
      rollNumber,
      email,
      phone: payload.phone,
      department: payload.department,
      semester: normalizedSemester,
      batchYear,
      cgpa: payload.cgpa ?? 0,
      attendance: payload.attendance ?? 0,
      careerInterest: payload.careerInterest ?? "",
      skillsAcquired: payload.skillsAcquired ?? [],
      placementStatus: payload.placementStatus ?? "Not Started",
      companyName: payload.companyName,
      activityPoints: payload.activityPoints ?? 0,
      activities: payload.activities ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db
      .collection<
        Student & { createdAt?: string; updatedAt?: string }
      >(COLLECTIONS.students)
      .insertOne(newStudent);

    // Prevent stale student/dashboard responses after mutations.
    apiCache.clear(`students:${advisorScope.advisorId}`);
    clearDashboardCache();

    const scopedStudents = (await db
      .collection<Student>(COLLECTIONS.students)
      .find({ advisorId: advisorScope.advisorId })
      .sort({ createdAt: -1 })
      .toArray()) as Student[];

    return NextResponse.json({ student: newStudent, students: scopedStudents });
  } catch (error) {
    console.error("Student create error:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}
