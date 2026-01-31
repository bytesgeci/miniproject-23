import { useState } from "react";
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
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewType, setReviewType] = useState<"file" | "report">("file");

  // Mock data
  const courseFiles: CourseFile[] = [
    {
      id: "1",
      fileName: "CS101_Syllabus_Fall2024.pdf",
      fileType: "Syllabus",
      uploadDate: "2024-11-15",
      courseName: "CS101 - Introduction to Programming",
      semester: "Fall 2024",
      status: "Submitted",
    },
  ];

  const eventReports: EventReport[] = [
    {
      id: "1",
      eventName: "Community Health Awareness Campaign",
      eventType: "Community Service",
      eventDate: "2024-11-15",
      location: "Local Community Center",
      participants: 45,
      duration: "4 hours",
      description:
        "Organized a health awareness campaign focusing on preventive healthcare and nutrition.",
      objectives:
        "Educate community members about healthy lifestyle choices and disease prevention",
      outcomes:
        "Successfully reached 45 community members, distributed health information materials",
      status: "Submitted",
    },
  ];

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
