import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSectionNav } from "@/components/user/UserSectionNav";
import {
  UserEventReportsSection,
  UserEventReportRecord,
} from "@/components/user/UserEventReportsSection";
import { readJsonFile } from "@/lib/jsonDb";
import { getAllUsers } from "@/lib/userStore";
import { getUserSectionCounts } from "@/lib/userSectionCounts";

interface EventReportRecord extends UserEventReportRecord {
  id: string;
  eventName: string;
  eventDate: string;
  community: string;
  facultyCoordinator?: string;
  facultyId?: string;
  status?: string;
}

interface UserEventReportsPageData {
  approvedCourseCodesCount: number;
  facultyNameById: Record<string, string>;
}

export default async function UserEventReportsPage() {
  const [users, reports, sectionCounts] = await Promise.all([
    getAllUsers(),
    readJsonFile<EventReportRecord[]>("eventReports.json"),
    getUserSectionCounts(),
  ]);

  const facultyNameById = Object.fromEntries(
    users
      .filter(
        (user) =>
          (user.role === "faculty" || user.roles?.includes("faculty")) &&
          user.role !== "admin",
      )
      .map((user) => [String(user.id), user.name]),
  );

  const approvedReports = reports.filter(
    (report) =>
      String(report.status || "")
        .trim()
        .toLowerCase() === "approved",
  );

  const pageData: UserEventReportsPageData = {
    approvedCourseCodesCount: sectionCounts.approvedCourseCodesCount,
    facultyNameById,
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

      <Card className="border-slate-200 bg-white/95 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-slate-900">
            Event Reports
          </CardTitle>
          <p className="text-sm text-slate-600">
            Year-wise representation of submitted event reports.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserEventReportsSection
            reports={approvedReports}
            facultyNameById={facultyNameById}
          />
        </CardContent>
      </Card>
    </main>
  );
}
