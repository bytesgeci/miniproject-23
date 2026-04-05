import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSectionNav } from "@/components/user/UserSectionNav";
import { UserCourseFilesExplorer } from "@/components/user/UserCourseFilesExplorer";
import { readJsonFile } from "@/lib/jsonDb";
import { getUserSectionCounts } from "@/lib/userSectionCounts";

interface CourseFileRecord {
  id: string;
  fileName: string;
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: string;
  fileType: string;
  uploadDate: string;
  facultyId?: string;
  facultyName?: string;
  status?: "Pending" | "Approved" | "Rejected" | string;
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  auditChecklistStatus?: "yes" | "no" | "pending";
  auditChecklistFinalized?: boolean;
  auditChecklistReport?: {
    courseCode: string;
    courseName?: string;
    academicYear?: string;
    checklist: Array<{
      id: string;
      label: string;
      status: "yes" | "no" | "pending";
    }>;
    remarks?: string;
    decision?: "approve" | "reject";
    updatedBy?: string;
    updatedAt?: string;
    isFinalized?: boolean;
  };
}

function isAuditorVerifiedCourseFile(file: CourseFileRecord) {
  const status = String(file.status || "")
    .trim()
    .toLowerCase();
  const checklistStatus = String(file.auditChecklistStatus || "")
    .trim()
    .toLowerCase();
  const checklistDecision = String(file.auditChecklistReport?.decision || "")
    .trim()
    .toLowerCase();

  return (
    status === "approved" ||
    checklistStatus === "yes" ||
    file.auditChecklistFinalized === true ||
    checklistDecision === "approve"
  );
}

interface SemesterGroup {
  semester: string;
  files: CourseFileRecord[];
}

interface BatchGroup {
  batch: string;
  totalFiles: number;
  semesterCount: number;
  semesters: SemesterGroup[];
}

interface CourseFilesPageData {
  approvedCourseCodesCount: number;
  batchGroups: BatchGroup[];
}

function normalizeCourseCode(courseCode?: string) {
  return String(courseCode || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function getSemesterOrder(semester: string) {
  const normalized = String(semester || "")
    .toLowerCase()
    .replace(/\s+/g, "");

  const numeric = normalized.match(/(\d+)/);
  if (numeric) {
    return Number(numeric[1]);
  }

  if (normalized.includes("odd")) return 99;
  if (normalized.includes("even")) return 100;
  return 101;
}

export default async function UserCourseFilesPage() {
  const [files, sectionCounts] = await Promise.all([
    readJsonFile<CourseFileRecord[]>("courseFiles.json"),
    getUserSectionCounts(),
  ]);

  const approvedFiles = files
    .filter((file) => isAuditorVerifiedCourseFile(file))
    .map((file) => ({
      ...file,
      facultyName: file.facultyName || "N/A",
    }));

  const filesByBatch = approvedFiles.reduce(
    (acc, file) => {
      const batch = file.academicYear || "Unknown Batch";
      if (!acc[batch]) {
        acc[batch] = [];
      }
      acc[batch].push(file);
      return acc;
    },
    {} as Record<string, CourseFileRecord[]>,
  );

  const batchGroups: BatchGroup[] = Object.keys(filesByBatch)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .map((batch) => {
      const batchFiles = filesByBatch[batch];
      const filesBySemester = batchFiles.reduce(
        (acc, file) => {
          const semester = file.semester || "Unknown Semester";
          if (!acc[semester]) {
            acc[semester] = [];
          }
          acc[semester].push(file);
          return acc;
        },
        {} as Record<string, CourseFileRecord[]>,
      );

      const semesters: SemesterGroup[] = Object.keys(filesBySemester)
        .sort((a, b) => getSemesterOrder(a) - getSemesterOrder(b))
        .map((semester) => ({
          semester,
          files: filesBySemester[semester].sort((a, b) => {
            const courseA = `${a.courseCode}|${a.fileName}`.toLowerCase();
            const courseB = `${b.courseCode}|${b.fileName}`.toLowerCase();
            return courseA.localeCompare(courseB);
          }),
        }));

      return {
        batch,
        totalFiles: batchFiles.length,
        semesterCount: semesters.length,
        semesters,
      };
    });

  const pageData: CourseFilesPageData = {
    approvedCourseCodesCount: new Set(
      (() => {
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
          .sort((a, b) => getSemesterOrder(b) - getSemesterOrder(a))[0];

        return latestSemester
          ? batchScopedFiles.filter(
              (file) => String(file.semester || "").trim() === latestSemester,
            )
          : batchScopedFiles;
      })()
        .map((file) => normalizeCourseCode(file.courseCode))
        .filter((courseCode) => Boolean(courseCode)),
    ).size,
    batchGroups,
  };

  const { approvedCourseCodesCount, eventReportsCount, studentsCount } =
    sectionCounts;

  return (
    <main className="space-y-6">
      <UserSectionNav
        courseFilesCount={approvedCourseCodesCount}
        eventReportsCount={eventReportsCount}
        studentsCount={studentsCount}
      />

      <Card>
        <CardHeader>
          <CardTitle>Course Files</CardTitle>
        </CardHeader>
        <CardContent>
          <UserCourseFilesExplorer batchGroups={pageData.batchGroups} />
        </CardContent>
      </Card>
    </main>
  );
}
