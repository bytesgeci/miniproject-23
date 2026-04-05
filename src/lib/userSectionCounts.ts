import { readJsonFile } from "@/lib/jsonDb";

interface CourseFileForCount {
  status?: string;
  auditChecklistStatus?: string;
  auditChecklistFinalized?: boolean;
  auditChecklistReport?: {
    decision?: string;
  };
  courseCode?: string;
  academicYear?: string;
  semester?: string;
}

interface EventReportForCount {
  status?: string;
}

export interface UserSectionCounts {
  approvedCourseCodesCount: number;
  eventReportsCount: number;
  studentsCount: number;
}

function normalizeCourseCode(courseCode?: string) {
  return String(courseCode || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function getSemesterRank(semester?: string) {
  const normalized = String(semester || "")
    .toLowerCase()
    .replace(/\s+/g, "");
  const numeric = normalized.match(/(\d+)/);
  if (numeric) return Number(numeric[1]);
  return -1;
}

function isApprovedStatus(status?: string) {
  return (
    String(status || "")
      .trim()
      .toLowerCase() === "approved"
  );
}

function isAuditorVerifiedCourseFile(file: CourseFileForCount) {
  const checklistStatus = String(file.auditChecklistStatus || "")
    .trim()
    .toLowerCase();
  const checklistDecision = String(file.auditChecklistReport?.decision || "")
    .trim()
    .toLowerCase();

  return (
    isApprovedStatus(file.status) ||
    checklistStatus === "yes" ||
    file.auditChecklistFinalized === true ||
    checklistDecision === "approve"
  );
}

export async function getUserSectionCounts(): Promise<UserSectionCounts> {
  const [files, reports, students] = await Promise.all([
    readJsonFile<CourseFileForCount[]>("courseFiles.json"),
    readJsonFile<EventReportForCount[]>("eventReports.json"),
    readJsonFile<unknown[]>("students.json"),
  ]);

  const approvedFiles = files.filter(isAuditorVerifiedCourseFile);
  const approvedReports = reports.filter((report) =>
    isApprovedStatus(report.status),
  );
  const latestBatch = approvedFiles
    .map((file) => String(file.academicYear || "").trim())
    .filter((batch) => Boolean(batch))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];

  const batchScopedFiles = latestBatch
    ? approvedFiles.filter(
        (file) => String(file.academicYear || "").trim() === latestBatch,
      )
    : approvedFiles;

  const latestSemester = [...batchScopedFiles]
    .map((file) => String(file.semester || "").trim())
    .filter((semester) => Boolean(semester))
    .sort((a, b) => getSemesterRank(b) - getSemesterRank(a))[0];

  const semesterScopedFiles = latestSemester
    ? batchScopedFiles.filter(
        (file) => String(file.semester || "").trim() === latestSemester,
      )
    : batchScopedFiles;

  return {
    approvedCourseCodesCount: new Set(
      semesterScopedFiles
        .map((file) => normalizeCourseCode(file.courseCode))
        .filter((courseCode) => Boolean(courseCode)),
    ).size,
    eventReportsCount: approvedReports.length,
    studentsCount: students.length,
  };
}
