import { useEffect, useState } from "react";
import { BackButton } from "./BackButton";
import { ProfileHeader } from "./ProfileHeader";
import { PortfolioTabs } from "./PortfolioTabs";
import { FileViewDialog } from "./FileViewDialog";
import { ReportViewDialog } from "./ReportViewDialog";
import {
  CourseFile,
  EventReport,
  FacultyMember,
  FacultyPortfolioProps,
  Student,
} from "./types";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { useAuth } from "@/context/AuthContext";

function normalizeSemesterLabel(semester?: string) {
  const raw = String(semester ?? "").trim();
  if (!raw) return "";

  const compact = raw.toLowerCase().replace(/[\s-]+/g, "");
  const numericMatch = compact.match(/^(?:semester|sem|s)?([1-8])$/);
  if (numericMatch) {
    return `S${numericMatch[1]}`;
  }

  if (compact === "odd") return "Odd";
  if (compact === "even") return "Even";

  return raw.toUpperCase();
}

function buildCourseTeachingEntries(files: CourseFile[]) {
  const uniqueCourses = new Map<string, string>();

  files.forEach((file) => {
    const courseCode = String(file.courseCode ?? "").trim();
    const courseName = String(file.courseName ?? "").trim();
    const batch = String(file.academicYear ?? "").trim();
    const semester = normalizeSemesterLabel(file.semester);
    const title = [courseCode, courseName].filter(Boolean).join(" - ");

    if (!title) {
      return;
    }

    const details: string[] = [];
    if (batch) {
      details.push(`Batch ${batch}`);
    }
    if (semester) {
      details.push(`Sem ${semester}`);
    }

    const label =
      details.length > 0 ? `${title} (${details.join(", ")})` : title;
    const key = [
      courseCode.toLowerCase(),
      courseName.toLowerCase(),
      batch.toLowerCase(),
      semester.toLowerCase(),
    ].join("|");

    uniqueCourses.set(key, label);
  });

  return Array.from(uniqueCourses.values()).sort((a, b) => a.localeCompare(b));
}

export function FacultyPortfolio({ faculty, onBack }: FacultyPortfolioProps) {
  const { user, userRole } = useAuth();
  const showStudents = faculty.isStaffAdvisor === true;
  const pageSize = 40;
  const [profileFaculty, setProfileFaculty] = useState<FacultyMember>(faculty);
  const [selectedFile, setSelectedFile] = useState<CourseFile | null>(null);
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(
    null,
  );
  const [isFileViewOpen, setIsFileViewOpen] = useState(false);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);
  const [eventReports, setEventReports] = useState<EventReport[]>([]);
  const [courseFilesPage, setCourseFilesPage] = useState(1);
  const [eventReportsPage, setEventReportsPage] = useState(1);
  const [courseFilesTotal, setCourseFilesTotal] = useState(0);
  const [eventReportsTotal, setEventReportsTotal] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<
    {
      id: string;
      facultyId: string;
      auditorId?: string;
      entityType: string;
      entityId: string;
      message: string;
      status?: string;
      createdAt?: string;
    }[]
  >([]);
  const canViewMessages = userRole !== "faculty";

  useEffect(() => {
    setCourseFilesPage(1);
    setEventReportsPage(1);
  }, [faculty.id]);

  useEffect(() => {
    setProfileFaculty(faculty);

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

        if (!response.ok || !data.user) {
          return;
        }

        setProfileFaculty((previous) => ({
          ...previous,
          name: data.user?.name ?? previous.name,
          department: data.user?.department ?? previous.department,
          email: data.user?.email ?? previous.email,
          phone: data.user?.phone ?? previous.phone,
          experience: data.user?.experience ?? previous.experience,
          profileImageUrl: data.user?.profileImageUrl ?? "",
          resumeUrl: data.user?.resumeUrl ?? "",
          resumeFileName: data.user?.resumeFileName ?? "",
        }));
      } catch (error) {
        console.error("Load faculty profile error:", error);
      }
    };

    const loadPortfolioData = async () => {
      try {
        const filesPromise = (async () => {
          const filesResponse = await fetch(
            `/api/course-files?facultyId=${encodeURIComponent(faculty.id)}&limit=${pageSize}&offset=${(courseFilesPage - 1) * pageSize}&includeMeta=0`,
          );
          const filesData = await filesResponse.json();
          if (!filesResponse.ok) {
            return;
          }

          const scopedFiles: CourseFile[] = filesData.files ?? [];
          const autoCourses = buildCourseTeachingEntries(scopedFiles);
          setCourseFiles(scopedFiles);
          setCourseFilesTotal(
            typeof filesData.total === "number"
              ? filesData.total
              : scopedFiles.length,
          );
          setProfileFaculty((previous) => ({
            ...previous,
            courses: autoCourses,
          }));
        })();

        const reportsPromise = (async () => {
          const reportsResponse = await fetch(
            `/api/event-reports?facultyId=${encodeURIComponent(faculty.id)}&limit=${pageSize}&offset=${(eventReportsPage - 1) * pageSize}&includeMeta=0&includeFaculty=0`,
          );
          const reportsData = await reportsResponse.json();
          if (!reportsResponse.ok) {
            return;
          }

          const scopedReports: EventReport[] = reportsData.reports ?? [];
          setEventReports(scopedReports);
          setEventReportsTotal(
            typeof reportsData.total === "number"
              ? reportsData.total
              : scopedReports.length,
          );
        })();

        const studentsPromise = (async () => {
          if (!showStudents) {
            setStudents([]);
            return;
          }

          const studentsResponse = await fetch("/api/students");
          const studentsData = await studentsResponse.json();
          if (!studentsResponse.ok) {
            setStudents([]);
            return;
          }

          const allStudents: Student[] = studentsData?.students ?? [];
          const advisorStudents = allStudents.filter(
            (student) => student.advisorId === faculty.id,
          );
          const scopedStudents =
            advisorStudents.length > 0
              ? advisorStudents
              : allStudents.filter(
                  (student) =>
                    student.department?.toLowerCase() ===
                    faculty.department.toLowerCase(),
                );
          setStudents(scopedStudents);
        })();

        const messagesPromise = (async () => {
          if (!canViewMessages) {
            setMessages([]);
            return;
          }

          const messagesResponse = await fetch(
            `/api/messages?facultyId=${faculty.id}`,
          );
          const messagesData = await messagesResponse.json();
          if (messagesResponse.ok) {
            setMessages(messagesData.messages ?? []);
          } else {
            setMessages([]);
          }
        })();

        await Promise.all([
          filesPromise,
          reportsPromise,
          studentsPromise,
          messagesPromise,
        ]);
      } catch (error) {
        console.error("Load faculty portfolio error:", error);
      }
    };

    loadPortfolioData();
    loadFacultyProfile();

    if (typeof window !== "undefined") {
      const handler = () => {
        loadPortfolioData();
        loadFacultyProfile();
      };
      window.addEventListener("dashboard:data-updated", handler);
      return () => {
        window.removeEventListener("dashboard:data-updated", handler);
      };
    }
  }, [
    faculty,
    faculty.id,
    faculty.department,
    showStudents,
    canViewMessages,
    courseFilesPage,
    eventReportsPage,
  ]);

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

  const handleViewReport = (report: EventReport) => {
    setSelectedReport(report);
    setIsReportViewOpen(true);
  };

  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} />
      <ProfileHeader faculty={profileFaculty} />
      {canViewMessages && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Auditor Messages</h3>
              <Badge variant="outline">{messages.length}</Badge>
            </div>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No auditor messages yet.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {msg.entityType === "course-file"
                          ? "Course File"
                          : "Event Report"}
                      </span>
                      {msg.status && (
                        <Badge variant="secondary">{msg.status}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{msg.message}</p>
                    {msg.createdAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <PortfolioTabs
        facultyId={faculty.id}
        courseFiles={courseFiles}
        eventReports={eventReports}
        courseFilesPage={courseFilesPage}
        eventReportsPage={eventReportsPage}
        pageSize={pageSize}
        totalCourseFiles={courseFilesTotal}
        totalEventReports={eventReportsTotal}
        onCourseFilesPageChange={setCourseFilesPage}
        onEventReportsPageChange={setEventReportsPage}
        students={students}
        showStudents={showStudents}
        onViewFile={handleViewFile}
        onViewReport={handleViewReport}
        getStatusColor={getStatusColor}
      />

      <FileViewDialog
        open={isFileViewOpen}
        onOpenChange={setIsFileViewOpen}
        file={selectedFile}
        getStatusColor={getStatusColor}
        facultyId={faculty.id}
      />

      <ReportViewDialog
        open={isReportViewOpen}
        onOpenChange={setIsReportViewOpen}
        report={selectedReport}
        getStatusColor={getStatusColor}
        facultyId={faculty.id}
      />
    </div>
  );
}
