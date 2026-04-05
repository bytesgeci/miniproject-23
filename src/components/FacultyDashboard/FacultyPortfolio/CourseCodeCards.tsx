import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  FileText,
  Eye,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { CourseFile } from "./types";
import { FileMessagesDialog } from "./FileMessagesDialog";

interface CourseCodeCardsProps {
  courseFiles: CourseFile[];
  onViewFile: (file: CourseFile) => void;
  getStatusColor: (status: string) => string;
}

// Helper function to group files by course code
const groupByCourseCode = (files: CourseFile[]) => {
  const grouped: Record<string, CourseFile[]> = {};

  files.forEach((file) => {
    const courseCode = file.courseCode || "Unknown";
    if (!grouped[courseCode]) {
      grouped[courseCode] = [];
    }
    grouped[courseCode].push(file);
  });

  return grouped;
};

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case "Approved":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "Rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "Pending":
    case "Submitted":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    default:
      return <FileText className="h-4 w-4 text-gray-600" />;
  }
};

// Helper function to download file by id (avoids shipping documentUrl in list payloads)
const downloadFile = (file: CourseFile) => {
  if (!file.id) {
    return;
  }

  const link = document.createElement("a");
  link.href = `/api/course-files/${encodeURIComponent(file.id)}/download`;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function CourseCodeCards({
  courseFiles,
  onViewFile,
  getStatusColor,
}: CourseCodeCardsProps) {
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [expandedChecklistCodes, setExpandedChecklistCodes] = useState<
    Record<string, boolean>
  >({});
  const [messageFile, setMessageFile] = useState<CourseFile | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const groupedFiles = groupByCourseCode(courseFiles);
  const courseCodes = Object.keys(groupedFiles).sort();

  const toggleExpand = (courseCode: string) => {
    setExpandedCodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseCode)) {
        newSet.delete(courseCode);
      } else {
        newSet.add(courseCode);
      }
      return newSet;
    });
  };

  const toggleChecklist = (courseCode: string) => {
    setExpandedChecklistCodes((prev) => {
      const nextIsOpen = !prev[courseCode];
      if (nextIsOpen) {
        setExpandedCodes((expanded) => {
          const next = new Set(expanded);
          next.add(courseCode);
          return next;
        });
      }
      return {
        ...prev,
        [courseCode]: nextIsOpen,
      };
    });
  };

  if (courseCodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No course files available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {courseCodes.map((courseCode) => {
        const files = groupedFiles[courseCode];
        const approvedCount = files.filter(
          (f) => f.status === "Approved",
        ).length;
        const pendingCount = files.filter(
          (f) => f.status === "Pending" || f.status === "Submitted",
        ).length;
        const rejectedCount = files.filter(
          (f) => f.status === "Rejected",
        ).length;

        // Get course name from first file
        const courseName = files[0]?.courseName || courseCode;
        const isExpanded = expandedCodes.has(courseCode);
        const courseChecklistReport =
          files.find((file) => file.auditChecklistReport)
            ?.auditChecklistReport ?? null;
        const isChecklistOpen = expandedChecklistCodes[courseCode] ?? false;

        return (
          <Card
            key={courseCode}
            className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
          >
            <CardHeader
              className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(courseCode)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {courseCode}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{courseName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {courseChecklistReport && (
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleChecklist(courseCode);
                      }}
                    >
                      {isChecklistOpen
                        ? "Hide Checklist Sheet"
                        : "View Checklist Sheet"}
                    </Button>
                  )}
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {files.length} {files.length === 1 ? "File" : "Files"}
                  </Badge>
                  {approvedCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {approvedCount}
                    </Badge>
                  )}
                  {pendingCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {pendingCount}
                    </Badge>
                  )}
                  {rejectedCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      {rejectedCount}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                <div className="space-y-3">
                  {courseChecklistReport && isChecklistOpen && (
                    <div className="rounded-lg border p-3 space-y-3 bg-white">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Auditor Checklist Sheet
                        </p>
                        <p className="text-xs text-gray-500">
                          {courseChecklistReport.courseCode}
                          {courseChecklistReport.academicYear
                            ? ` • ${courseChecklistReport.academicYear}`
                            : ""}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm max-h-52 overflow-y-auto pr-1">
                        {courseChecklistReport.checklist.map((entry) => (
                          <div
                            key={`${courseCode}-${entry.id}`}
                            className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0"
                          >
                            <span className="text-gray-700">{entry.label}</span>
                            <span
                              className={`font-medium ${
                                entry.status === "yes"
                                  ? "text-green-700"
                                  : entry.status === "no"
                                    ? "text-red-700"
                                    : "text-yellow-700"
                              }`}
                            >
                              {entry.status === "yes"
                                ? "Completed"
                                : entry.status === "no"
                                  ? "Needs Update"
                                  : "Pending"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(file.status || "Draft")}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {file.fileName}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {file.fileType}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(file.uploadDate).toLocaleDateString()}
                            </span>
                            {file.semester && <span>{file.semester}</span>}
                          </div>
                        </div>
                        {file.status && (
                          <Badge className={getStatusColor(file.status)}>
                            {file.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewFile(file)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadFile(file)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="ml-2 flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMessageFile(file);
                            setIsMessageDialogOpen(true);
                          }}
                          className="h-8 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600"
                          title="View messages from auditor"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <Badge variant="secondary" className="ml-1 h-5">
                            !
                          </Badge>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      <FileMessagesDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        file={messageFile}
        facultyId={messageFile?.facultyId || courseFiles[0]?.facultyId}
      />
    </div>
  );
}
