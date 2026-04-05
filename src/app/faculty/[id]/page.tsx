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

function normalizeIdentity(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getUserIdentityVariants(user: {
  id?: string;
  username?: string;
  email?: string;
  firebaseUid?: string;
}) {
  const variants = new Set<string>();

  [user.id, user.username, user.email, user.firebaseUid].forEach((value) => {
    const normalized = normalizeIdentity(value);
    if (normalized) {
      variants.add(normalized);
    }
  });

  return variants;
}

function buildProfileCourseEntries(courseFiles: CourseFile[]) {
  const uniqueCourses = new Set<string>();

  courseFiles.forEach((file) => {
    const code = String(file.courseCode ?? "").trim();
    const name = String(file.courseName ?? "").trim();
    const combined = [code, name].filter(Boolean).join(" - ");
    if (combined) {
      uniqueCourses.add(combined);
    }
  });

  return Array.from(uniqueCourses).sort((a, b) => a.localeCompare(b));
}

export default async function FacultyProfilePage({
  params,
}: FacultyProfilePageProps) {
  const { id } = await params;

  // Get all users
  const users = await getAllUsers();
  const lookup = normalizeIdentity(id);
  const user = users.find((u) => {
    const isFaculty =
      (u.role === "faculty" || u.roles?.includes("faculty")) &&
      u.role !== "admin";
    if (!isFaculty) {
      return false;
    }

    const identities = getUserIdentityVariants({
      id: String(u.id ?? ""),
      username: String(u.username ?? ""),
      email: String(u.email ?? ""),
      firebaseUid: String(u.firebaseUid ?? ""),
    });
    return identities.has(lookup);
  });

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
  // Match by all known user identities, not only id.
  const userIdentityVariants = getUserIdentityVariants({
    id: String(user.id ?? ""),
    username: String(user.username ?? ""),
    email: String(user.email ?? ""),
    firebaseUid: String(user.firebaseUid ?? ""),
  });

  const normalizedFacultyIds = new Set<string>();
  userIdentityVariants.forEach((variant) => {
    normalizeIdForMatching(variant).forEach((normalized) => {
      normalizedFacultyIds.add(normalized);
    });
  });

  const allCourseFiles = await readJsonFile<CourseFile[]>("courseFiles.json");
  const courseFiles = allCourseFiles.filter((file) => {
    if (!file?.facultyId) return false;
    const normalizedFileIds = normalizeIdForMatching(String(file.facultyId));
    return normalizedFileIds.some((fid) => normalizedFacultyIds.has(fid));
  });

  // Get event reports for this faculty
  const allEventReports =
    await readJsonFile<EventReport[]>("eventReports.json");
  const eventReports = allEventReports.filter((report) => {
    if (!report?.facultyId) return false;
    const normalizedReportIds = normalizeIdForMatching(
      String(report.facultyId),
    );
    return normalizedReportIds.some((rid) => normalizedFacultyIds.has(rid));
  });

  const coursesFromFiles = buildProfileCourseEntries(courseFiles);
  const mergedCourses = Array.from(
    new Set([
      ...(Array.isArray(faculty.courses) ? faculty.courses : []),
      ...coursesFromFiles,
    ]),
  );

  const hydratedFaculty: FacultyMember = {
    ...faculty,
    courses: mergedCourses,
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <FacultyProfileView
          faculty={hydratedFaculty}
          courseFiles={courseFiles}
          eventReports={eventReports}
        />
      </div>
    </main>
  );
}
