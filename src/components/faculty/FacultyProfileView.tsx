"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FacultyMember } from "@/types/faculty";
import type {
  CourseFile,
  EventReport,
} from "@/components/FacultyDashboard/FacultyPortfolio/types";
import { ProfileHeader } from "@/components/FacultyDashboard/FacultyPortfolio/ProfileHeader";
import { PortfolioTabs } from "@/components/FacultyDashboard/FacultyPortfolio/PortfolioTabs";
import { FileViewDialog } from "@/components/FacultyDashboard/FacultyPortfolio/FileViewDialog";
import { ReportViewDialog } from "@/components/FacultyDashboard/FacultyPortfolio/ReportViewDialog";

interface FacultyProfileViewProps {
  faculty: FacultyMember;
  courseFiles: CourseFile[];
  eventReports: EventReport[];
}

export function FacultyProfileView({
  faculty: initialFaculty,
  courseFiles: initialCourseFiles,
  eventReports: initialEventReports,
}: FacultyProfileViewProps) {
  const pageSize = 40;
  const [selectedFile, setSelectedFile] = useState<CourseFile | null>(null);
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(
    null,
  );
  const [isFileViewOpen, setIsFileViewOpen] = useState(false);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);
  const [courseFiles, setCourseFiles] = useState(initialCourseFiles);
  const [eventReports, setEventReports] = useState(initialEventReports);
  const [courseFilesPage, setCourseFilesPage] = useState(1);
  const [eventReportsPage, setEventReportsPage] = useState(1);
  const [courseFilesTotal, setCourseFilesTotal] = useState(
    initialCourseFiles.length,
  );
  const [eventReportsTotal, setEventReportsTotal] = useState(
    initialEventReports.length,
  );
  const [faculty, setFaculty] = useState(initialFaculty);

  useEffect(() => {
    setCourseFilesPage(1);
    setEventReportsPage(1);
  }, [faculty.id]);

  // Load additional faculty profile data on client side
  useEffect(() => {
    const loadFacultyProfile = async () => {
      try {
        const response = await fetch(
          `/api/profile?userId=${encodeURIComponent(faculty.id)}`,
          {
            cache: "no-store",
          },
        );
        const data = (await response.json()) as {
          user?: {
            name?: string;
            department?: string;
            email?: string;
            phone?: string;
            experience?: string;
            profileImageUrl?: string;
            resumeUrl?: string;
            resumeFileName?: string;
          };
        };

        if (response.ok && data.user) {
          setFaculty((prev) => ({
            ...prev,
            name: data.user?.name ?? prev.name,
            department: data.user?.department ?? prev.department,
            email: data.user?.email ?? prev.email,
            phone: data.user?.phone ?? prev.phone,
            experience: data.user?.experience ?? prev.experience,
            profileImageUrl: data.user?.profileImageUrl ?? "",
            resumeUrl: data.user?.resumeUrl ?? "",
            resumeFileName: data.user?.resumeFileName ?? "",
          }));
        }
      } catch (error) {
        console.error("Load faculty profile error:", error);
      }
    };

    loadFacultyProfile();
  }, [faculty.id]);

  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        const [filesResponse, reportsResponse] = await Promise.all([
          fetch(
            `/api/course-files?facultyId=${encodeURIComponent(faculty.id)}&limit=${pageSize}&offset=${(courseFilesPage - 1) * pageSize}&includeMeta=0&includeFaculty=0&fields=facultyId,fileName,documentUrl,courseCode,courseName,fileType,uploadDate,semester,academicYear,status,auditorRemarks,auditChecklistStatus,auditChecklistFinalized,auditChecklistReport`,
            { cache: "no-store" },
          ),
          fetch(
            `/api/event-reports?facultyId=${encodeURIComponent(faculty.id)}&limit=${pageSize}&offset=${(eventReportsPage - 1) * pageSize}&includeMeta=0&includeFaculty=0&fields=facultyId,eventName,eventType,eventDate,location,participants,duration,status,facultyCoordinator,community,department,description,objectives,outcomes`,
            { cache: "no-store" },
          ),
        ]);

        const filesData = await filesResponse.json();
        const reportsData = await reportsResponse.json();

        if (filesResponse.ok) {
          const scopedFiles: CourseFile[] = filesData.files ?? [];
          setCourseFiles(scopedFiles);
          setCourseFilesTotal(
            typeof filesData.total === "number"
              ? filesData.total
              : scopedFiles.length,
          );
        }

        if (reportsResponse.ok) {
          const scopedReports: EventReport[] = reportsData.reports ?? [];
          setEventReports(scopedReports);
          setEventReportsTotal(
            typeof reportsData.total === "number"
              ? reportsData.total
              : scopedReports.length,
          );
        }
      } catch (error) {
        console.error("Load faculty profile portfolio data error:", error);
      }
    };

    loadPortfolioData();
  }, [faculty.id, courseFilesPage, eventReportsPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
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

  const handleViewReport = async (report: EventReport) => {
    setSelectedReport(report);
    setIsReportViewOpen(true);

    try {
      const response = await fetch(`/api/event-reports/${report.id}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data?.report) {
        setSelectedReport(data.report as EventReport);
      }
    } catch (error) {
      console.error("Load full event report error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <ProfileHeader faculty={faculty} />

      {/* Portfolio Tabs */}
      <PortfolioTabs
        courseFiles={courseFiles}
        eventReports={eventReports}
        courseFilesPage={courseFilesPage}
        eventReportsPage={eventReportsPage}
        pageSize={pageSize}
        totalCourseFiles={courseFilesTotal}
        totalEventReports={eventReportsTotal}
        onCourseFilesPageChange={setCourseFilesPage}
        onEventReportsPageChange={setEventReportsPage}
        students={[]}
        showStudents={false}
        onViewFile={handleViewFile}
        onViewReport={handleViewReport}
        getStatusColor={getStatusColor}
      />

      {/* File View Dialog */}
      <FileViewDialog
        open={isFileViewOpen}
        onOpenChange={setIsFileViewOpen}
        file={selectedFile}
        getStatusColor={getStatusColor}
      />

      {/* Report View Dialog */}
      <ReportViewDialog
        open={isReportViewOpen}
        onOpenChange={setIsReportViewOpen}
        report={selectedReport}
        getStatusColor={getStatusColor}
      />

      {/* No Data Message */}
      {courseFiles.length === 0 && eventReports.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No course files or event reports available yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
