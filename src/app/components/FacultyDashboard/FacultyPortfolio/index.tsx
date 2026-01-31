import { useState } from "react";
import { BackButton } from "./BackButton";
import { ProfileHeader } from "./ProfileHeader";
import { PortfolioTabs } from "./PortfolioTabs";
import { FileViewDialog } from "./FileViewDialog";
import { ReportViewDialog } from "./ReportViewDialog";
import { CourseFile, EventReport, FacultyPortfolioProps } from "./types";

export function FacultyPortfolio({ faculty, onBack }: FacultyPortfolioProps) {
  const [selectedFile, setSelectedFile] = useState<CourseFile | null>(null);
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(null);
  const [isFileViewOpen, setIsFileViewOpen] = useState(false);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);

  // Mock data - Replace with actual API call
  const courseFiles: CourseFile[] = [
    {
      id: "1",
      fileName: "CS101_Syllabus_Fall2024.pdf",
      fileType: "Syllabus",
      uploadDate: "2024-11-15",
      courseName: "CS101 - Introduction to Programming",
      semester: "Fall 2024",
      status: "Approved",
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
      status: "Approved",
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

  const handleViewFile = (file: CourseFile) => {
    setSelectedFile(file);
    setIsFileViewOpen(true);
  };

  const handleViewReport = (report: EventReport) => {
    setSelectedReport(report);
    setIsReportViewOpen(true);
  };

  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} />
      <ProfileHeader faculty={faculty} />
      <PortfolioTabs
        courseFiles={courseFiles}
        eventReports={eventReports}
        onViewFile={handleViewFile}
        onViewReport={handleViewReport}
        getStatusColor={getStatusColor}
      />

      <FileViewDialog
        open={isFileViewOpen}
        onOpenChange={setIsFileViewOpen}
        file={selectedFile}
        getStatusColor={getStatusColor}
      />

      <ReportViewDialog
        open={isReportViewOpen}
        onOpenChange={setIsReportViewOpen}
        report={selectedReport}
        getStatusColor={getStatusColor}
      />
    </div>
  );
}
