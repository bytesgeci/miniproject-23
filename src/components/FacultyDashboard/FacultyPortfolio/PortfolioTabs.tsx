import { Card, CardContent } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { FileText, Calendar } from "lucide-react";
import { useMemo } from "react";
import { CourseFile, EventReport, Student } from "./types";
import { EventReportCard } from "./EventReportCard";
import { CourseCodeCards } from "./CourseCodeCards";
import { StudentListTab } from "./StudentListTab";

interface PortfolioTabsProps {
  facultyId?: string;
  courseFiles: CourseFile[];
  eventReports: EventReport[];
  courseFilesPage: number;
  eventReportsPage: number;
  pageSize: number;
  totalCourseFiles: number;
  totalEventReports: number;
  onCourseFilesPageChange: (page: number) => void;
  onEventReportsPageChange: (page: number) => void;
  students?: Student[];
  showStudents?: boolean;
  onViewFile: (file: CourseFile) => void;
  onViewReport: (report: EventReport) => void;
  getStatusColor: (status: string) => string;
}

export function PortfolioTabs({
  facultyId,
  courseFiles,
  eventReports,
  courseFilesPage,
  eventReportsPage,
  pageSize,
  totalCourseFiles,
  totalEventReports,
  onCourseFilesPageChange,
  onEventReportsPageChange,
  students = [],
  showStudents = false,
  onViewFile,
  onViewReport,
  getStatusColor,
}: PortfolioTabsProps) {
  const totalCourseFilePages = Math.max(
    1,
    Math.ceil(totalCourseFiles / pageSize),
  );
  const totalEventReportPages = Math.max(
    1,
    Math.ceil(totalEventReports / pageSize),
  );

  const tabCount = showStudents ? 3 : 2;
  const tabsClassName =
    tabCount === 3 ? "grid w-full grid-cols-3" : "grid w-full grid-cols-2";
  const defaultTabValue = "course-files";

  const courseFileSummary = useMemo(() => {
    const total = courseFiles.length;
    const approved = courseFiles.filter((f) => f.status === "Approved").length;
    const underReview = courseFiles.filter(
      (f) => f.status === "Pending" || f.status === "Submitted",
    ).length;

    return { total, approved, underReview };
  }, [courseFiles]);

  const eventReportSummary = useMemo(() => {
    const total = eventReports.length;
    const approved = eventReports.filter((r) => r.status === "Approved").length;
    const participants = eventReports.reduce(
      (sum, report) => sum + report.participants,
      0,
    );

    return { total, approved, participants };
  }, [eventReports]);

  return (
    <Tabs defaultValue={defaultTabValue} className="w-full">
      <TabsList className={tabsClassName}>
        <TabsTrigger value="course-files" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Course Files ({courseFiles.length})
        </TabsTrigger>
        <TabsTrigger value="event-reports" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Event Reports ({eventReports.length})
        </TabsTrigger>
        {showStudents && (
          <TabsTrigger value="students" className="flex items-center gap-2">
            Students ({students.length})
          </TabsTrigger>
        )}
      </TabsList>

      {/* Course Files Tab - Grouped by Course Code */}
      <TabsContent value="course-files" className="space-y-4 mt-6">
        <CourseCodeCards
          courseFiles={courseFiles}
          onViewFile={onViewFile}
          getStatusColor={getStatusColor}
        />

        {/* Summary Stats */}
        {courseFiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {courseFileSummary.total}
                </div>
                <p className="text-sm text-gray-500">Total Files</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {courseFileSummary.approved}
                </div>
                <p className="text-sm text-gray-500">Approved Files</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {courseFileSummary.underReview}
                </div>
                <p className="text-sm text-gray-500">Under Review</p>
              </CardContent>
            </Card>
          </div>
        )}

        {totalCourseFilePages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-sm text-gray-600">
              Page {courseFilesPage} of {totalCourseFilePages} (
              {totalCourseFiles} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onCourseFilesPageChange(Math.max(1, courseFilesPage - 1))
                }
                disabled={courseFilesPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onCourseFilesPageChange(
                    Math.min(totalCourseFilePages, courseFilesPage + 1),
                  )
                }
                disabled={courseFilesPage >= totalCourseFilePages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      {/* Event Reports Tab */}
      <TabsContent value="event-reports" className="space-y-4 mt-6">
        {eventReports.length === 0 ? (
          <Alert>
            <AlertDescription className="text-sm text-gray-500">
              No event reports available yet.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventReports.map((report) => (
                <EventReportCard
                  key={report.id}
                  report={report}
                  facultyId={facultyId}
                  onView={onViewReport}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {eventReportSummary.total}
                  </div>
                  <p className="text-sm text-gray-500">Total Reports</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {eventReportSummary.approved}
                  </div>
                  <p className="text-sm text-gray-500">Approved Reports</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {eventReportSummary.participants}
                  </div>
                  <p className="text-sm text-gray-500">Total Participants</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {totalEventReportPages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-sm text-gray-600">
              Page {eventReportsPage} of {totalEventReportPages} (
              {totalEventReports} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onEventReportsPageChange(Math.max(1, eventReportsPage - 1))
                }
                disabled={eventReportsPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onEventReportsPageChange(
                    Math.min(totalEventReportPages, eventReportsPage + 1),
                  )
                }
                disabled={eventReportsPage >= totalEventReportPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      {showStudents && (
        <TabsContent value="students" className="space-y-4 mt-6">
          <StudentListTab students={students} />
        </TabsContent>
      )}
    </Tabs>
  );
}
