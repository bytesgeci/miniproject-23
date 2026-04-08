"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FacultyMember } from "@/types/faculty";
import type {
  CourseFile,
  EventReport,
} from "@/components/FacultyDashboard/FacultyPortfolio/types";
import { ProfileHeader } from "@/components/FacultyDashboard/FacultyPortfolio/ProfileHeader";
import { PortfolioTabs } from "@/components/FacultyDashboard/FacultyPortfolio/PortfolioTabs";
import { FileViewDialog } from "@/components/FacultyDashboard/FacultyPortfolio/FileViewDialog";
import { ReportViewDialog } from "@/components/FacultyDashboard/FacultyPortfolio/ReportViewDialog";
import { fetchJsonCached } from "@/lib/clientFetchCache";

interface FacultyProfileViewProps {
  faculty: FacultyMember;
  courseFiles: CourseFile[];
  eventReports: EventReport[];
}

interface ProfileResponse {
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
}

interface PortfolioResponse {
  files?: CourseFile[];
  reports?: EventReport[];
  totalFiles?: number;
  totalReports?: number;
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
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);

  useEffect(() => {
    setCourseFilesPage(1);
    setEventReportsPage(1);
  }, [faculty.id]);

  // Load additional faculty profile data on client side
  useEffect(() => {
    const loadFacultyProfile = async () => {
      try {
        const data = await fetchJsonCached<ProfileResponse>(
          `profile:${faculty.id}`,
          `/api/profile?userId=${encodeURIComponent(faculty.id)}`,
          { ttlMs: 60_000 },
        );

        if (data.user) {
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
      setIsPortfolioLoading(true);
      try {
        const query = new URLSearchParams({
          facultyId: faculty.id,
          pageSize: String(pageSize),
          courseFilesPage: String(courseFilesPage),
          eventReportsPage: String(eventReportsPage),
        });

        if (faculty.username) {
          query.set("facultyUsername", faculty.username);
        }

        if (faculty.email) {
          query.set("facultyEmail", faculty.email);
        }

        if (faculty.name) {
          query.set("facultyName", faculty.name);
        }

        const cacheKey = `faculty-portfolio:${query.toString()}`;
        const data = await fetchJsonCached<PortfolioResponse>(
          cacheKey,
          `/api/faculty-portfolio?${query.toString()}`,
          { ttlMs: 20_000 },
        );
        const scopedFiles: CourseFile[] = data.files ?? [];
        const scopedReports: EventReport[] = data.reports ?? [];

        setCourseFiles(scopedFiles);
        setEventReports(scopedReports);
        setCourseFilesTotal(
          typeof data.totalFiles === "number"
            ? data.totalFiles
            : scopedFiles.length,
        );
        setEventReportsTotal(
          typeof data.totalReports === "number"
            ? data.totalReports
            : scopedReports.length,
        );
      } catch (error) {
        console.error("Load faculty profile portfolio data error:", error);
      } finally {
        setIsPortfolioLoading(false);
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

  const handleViewFile = async (file: CourseFile) => {
    setSelectedFile(file);
    setIsFileViewOpen(true);

    try {
      const data = await fetchJsonCached<{ file?: CourseFile }>(
        `course-file:${file.id}`,
        `/api/course-files/${file.id}`,
        { ttlMs: 60_000 },
      );
      if (data?.file) {
        setSelectedFile(data.file as CourseFile);
      }
    } catch (error) {
      console.error("Load full course file error:", error);
    }
  };

  const handleViewReport = async (report: EventReport) => {
    setSelectedReport(report);
    setIsReportViewOpen(true);

    try {
      const data = await fetchJsonCached<{ report?: EventReport }>(
        `event-report:${report.id}`,
        `/api/event-reports/${report.id}`,
        { ttlMs: 60_000 },
      );
      if (data?.report) {
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
      {isPortfolioLoading &&
      courseFiles.length === 0 &&
      eventReports.length === 0 ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : (
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
      )}

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
