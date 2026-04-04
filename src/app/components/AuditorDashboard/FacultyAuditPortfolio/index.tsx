import { useEffect, useState } from "react";
import { AuditReviewInterface } from "../AuditReviewInterface";
import { BackButton } from "./BackButton";
import { FacultyHeader } from "./FacultyHeader";
import { PortfolioTabs } from "./PortfolioTabs";
import { CourseFile, EventReport, FacultyAuditPortfolioProps } from "./types";

// Mock data
const courseFileChecklist = [
  { id: "format", label: "Document format is correct and readable" },
  { id: "content", label: "Content is complete and comprehensive" },
];

const eventReportChecklist = [
  { id: "details", label: "Event details are complete and accurate" },
  { id: "objectives", label: "Objectives are clearly stated" },
];

export function FacultyAuditPortfolio({
  faculty,
  onBack,
}: FacultyAuditPortfolioProps) {
  const [selectedFile, setSelectedFile] = useState<CourseFile | null>(null);
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(
    null,
  );
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewType, setReviewType] = useState<"file" | "report">("file");
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);
  const [eventReports, setEventReports] = useState<EventReport[]>([]);

  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        const [filesResponse, reportsResponse] = await Promise.all([
          fetch("/api/course-files"),
          fetch("/api/event-reports"),
        ]);

        const filesData = await filesResponse.json();
        const reportsData = await reportsResponse.json();

        if (!filesResponse.ok || !reportsResponse.ok) {
          return;
        }

        const scopedFiles: CourseFile[] = (filesData.files ?? []).filter(
          (file: CourseFile) => file.facultyId === faculty.id,
        );
        const scopedReports: EventReport[] = (reportsData.reports ?? []).filter(
          (report: EventReport) => report.facultyId === faculty.id,
        );

        setCourseFiles(scopedFiles);
        setEventReports(scopedReports);
      } catch (error) {
        console.error("Load faculty portfolio error:", error);
      }
    };

    loadPortfolioData();
  }, [faculty.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Submitted":
        return "bg-blue-100 text-blue-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleReviewFile = (file: CourseFile) => {
    setSelectedFile(file);
    setReviewType("file");
    setIsReviewOpen(true);
  };

  const handleReviewReport = (report: EventReport) => {
    setSelectedReport(report);
    setReviewType("report");
    setIsReviewOpen(true);
  };

  if (isReviewOpen && (selectedFile || selectedReport)) {
    return (
      <AuditReviewInterface
        type={reviewType}
        item={reviewType === "file" ? selectedFile! : selectedReport!}
        facultyName={faculty.name}
        facultyId={faculty.id}
        onBack={() => setIsReviewOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} />
      <FacultyHeader faculty={faculty} />
      <PortfolioTabs
        courseFiles={courseFiles}
        eventReports={eventReports}
        onReviewFile={handleReviewFile}
        onReviewReport={handleReviewReport}
        getStatusColor={getStatusColor}
      />
    </div>
  );
}
