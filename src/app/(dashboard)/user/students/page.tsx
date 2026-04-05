import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSectionNav } from "@/components/user/UserSectionNav";
import { readJsonFile } from "@/lib/jsonDb";
import { getUserSectionCounts } from "@/lib/userSectionCounts";
import {
  UserStudentsCards,
  type UserStudentBatchGroup,
  type UserStudentRecord,
} from "@/components/user/UserStudentsCards";

export default async function UserStudentsPage() {
  const [students, sectionCounts] = await Promise.all([
    readJsonFile<UserStudentRecord[]>("students.json"),
    getUserSectionCounts(),
  ]);

  const batchGroups: UserStudentBatchGroup[] = Object.entries(
    students.reduce<Record<string, UserStudentRecord[]>>(
      (accumulator, student) => {
        const batch = String(student.batchYear || "Unknown Batch").trim();
        if (!accumulator[batch]) {
          accumulator[batch] = [];
        }
        accumulator[batch].push(student);
        return accumulator;
      },
      {},
    ),
  )
    .map(([batch, batchStudents]) => ({
      batch,
      students: [...batchStudents].sort((a, b) => {
        const rollA = String(a.rollNumber || "")
          .trim()
          .toLowerCase();
        const rollB = String(b.rollNumber || "")
          .trim()
          .toLowerCase();
        if (rollA && rollB) {
          return rollA.localeCompare(rollB, undefined, { numeric: true });
        }
        return String(a.name || "").localeCompare(String(b.name || ""));
      }),
    }))
    .sort((a, b) =>
      b.batch.localeCompare(a.batch, undefined, { numeric: true }),
    );

  const { approvedCourseCodesCount, eventReportsCount, studentsCount } = {
    eventReportsCount: sectionCounts.eventReportsCount,
    approvedCourseCodesCount: sectionCounts.approvedCourseCodesCount,
    studentsCount: students.length,
  };

  return (
    <main className="space-y-6">
      <UserSectionNav
        courseFilesCount={approvedCourseCodesCount}
        eventReportsCount={eventReportsCount}
        studentsCount={studentsCount}
      />

      <UserStudentsCards batchGroups={batchGroups} />
    </main>
  );
}
