import { Card, CardContent } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { FileText, Calendar } from "lucide-react";
import { CourseFile, EventReport } from "./types";
import { CourseFileCard } from "./CourseFileCard";
import { EventReportCard } from "./EventReportCard";

interface PortfolioTabsProps {
  courseFiles: CourseFile[];
  eventReports: EventReport[];
  onViewFile: (file: CourseFile) => void;
  onViewReport: (report: EventReport) => void;
  getStatusColor: (status: string) => string;
}

export function PortfolioTabs({
  courseFiles,
  eventReports,
  onViewFile,
  onViewReport,
  getStatusColor,
}: PortfolioTabsProps) {
  return (
    <Tabs defaultValue="course-files" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="course-files" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Course Files ({courseFiles.length})
        </TabsTrigger>
        <TabsTrigger value="event-reports" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Event Reports ({eventReports.length})
        </TabsTrigger>
      </TabsList>

      {/* Course Files Tab */}
      <TabsContent value="course-files" className="space-y-4 mt-6">
        {courseFiles.length === 0 ? (
          <Alert>
            <AlertDescription className="text-sm text-gray-500">
              No course files available yet.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseFiles.map((file) => (
                <CourseFileCard
                  key={file.id}
                  file={file}
                  onView={onViewFile}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{courseFiles.length}</div>
                  <p className="text-sm text-gray-500">Total Files</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {courseFiles.filter((f) => f.status === "Approved").length}
                  </div>
                  <p className="text-sm text-gray-500">Approved Files</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {courseFiles.filter((f) => f.status === "Submitted").length}
                  </div>
                  <p className="text-sm text-gray-500">Under Review</p>
                </CardContent>
              </Card>
            </div>
          </>
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
                  onView={onViewReport}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{eventReports.length}</div>
                  <p className="text-sm text-gray-500">Total Reports</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {eventReports.filter((r) => r.status === "Approved").length}
                  </div>
                  <p className="text-sm text-gray-500">Approved Reports</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {eventReports.reduce((sum, r) => sum + r.participants, 0)}
                  </div>
                  <p className="text-sm text-gray-500">Total Participants</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
