import { notFound } from "next/navigation";
import type { FacultyMember } from "@/types/faculty";
import { getAllUsers } from "@/lib/userStore";
import { readJsonFile } from "@/lib/jsonDb";
import type {
  CourseFile,
  EventReport,
} from "@/components/FacultyDashboard/FacultyPortfolio/types";
import { FacultyProfileView } from "@/components/faculty/FacultyProfileView";

interface FacultyProfilePageProps {
  params: Promise<{ id: string }>;
}

// Disable caching to always show fresh data when files are uploaded
export const revalidate = 0;

// Helper to normalize IDs for matching (handles ObjectId and string formats)
function normalizeIdForMatching(id: string): string[] {
  const normalized = String(id || "").trim();
  if (!normalized) return [];

  // Return multiple potential formats the ID could be stored as
  return [
    normalized,
    normalized.toLowerCase(),
    // Also try removing/adding quotes if it looks like serialized ObjectId
    normalized.replace(/^ObjectId\("/, "").replace(/"\)$/, ""),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
}

export default async function FacultyProfilePage({
  params,
}: FacultyProfilePageProps) {
  const { id } = await params;

  // Get all users
  const users = await getAllUsers();
  const user = users.find(
    (u) =>
      u.id === id &&
      (u.role === "faculty" || u.roles?.includes("faculty")) &&
      u.role !== "admin",
  );

  if (!user) {
    notFound();
  }

  // Convert user to FacultyMember
  const faculty: FacultyMember = {
    id: String(user.id),
    name: user.name,
    department: user.department ?? "N/A",
    role: user.role,
    roles: user.roles,
    isStaffAdvisor: user.roles?.includes("staff-advisor") ?? false,
    email: user.email ?? user.username ?? "N/A",
    phone: user.phone ?? "N/A",
    courses: Array.isArray(user.courses) ? user.courses : [],
    specialization: user.specialization ?? "General",
    experience: user.experience ?? "",
    resumeUrl: user.resumeUrl,
    resumeFileName: user.resumeFileName,
  };

  // Get course files for this faculty
  // Use improved ID matching to handle format mismatches
  const normalizedFacultyIds = normalizeIdForMatching(faculty.id);
  const allCourseFiles = await readJsonFile<CourseFile[]>("courseFiles.json");
  const courseFiles = allCourseFiles.filter((file) => {
    if (!file?.facultyId) return false;
    const normalizedFileIds = normalizeIdForMatching(String(file.facultyId));
    return normalizedFileIds.some((fid) => normalizedFacultyIds.includes(fid));
  });

  // Get event reports for this faculty
  const allEventReports =
    await readJsonFile<EventReport[]>("eventReports.json");
  const eventReports = allEventReports.filter((report) => {
    if (!report?.facultyId) return false;
    const normalizedReportIds = normalizeIdForMatching(
      String(report.facultyId),
    );
    return normalizedReportIds.some((rid) =>
      normalizedFacultyIds.includes(rid),
    );
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <FacultyProfileView
          faculty={faculty}
          courseFiles={courseFiles}
          eventReports={eventReports}
        />
      </div>
    </main>
  );
}
