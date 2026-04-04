import type {
  ActivityItem,
  DashboardStats,
  FacultyMember,
} from "@/types/faculty";
import type {
  DashboardStats as AuditorStats,
  FacultyMember as AuditorFacultyMember,
  RecentReview,
} from "@/components/AuditorDashboard/types";
import type {
  BatchCourseOverview,
  CareerStats,
  DashboardStats as StaffStats,
  Student,
} from "@/components/StaffAdvisorDashboard/types";
import { getAllUsers } from "@/lib/userStore";
import { normalizeRoleInput } from "@/lib/adminConfig";

// Helper to serialize objects with MongoDB ObjectIds for client components
function serializeId(id: unknown): string {
  if (id === null || id === undefined) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object" && "toString" in id) {
    return String(id);
  }
  return String(id);
}

function normalizeIdentity(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

interface DashboardFacultyMember extends FacultyMember {}

const FACULTY_DASHBOARD_CACHE_TTL_MS = 20000;
const STAFF_ADVISOR_DASHBOARD_CACHE_TTL_MS = 30000;
const facultyDashboardCache = new Map<
  string,
  { expiresAt: number; data: FacultyDashboardData }
>();
const staffAdvisorDashboardCache = new Map<
  string,
  { expiresAt: number; data: StaffAdvisorDashboardData }
>();

export interface FacultyDashboardData {
  stats: DashboardStats;
  facultyMembers: FacultyMember[];
}

interface FacultyListResponse {
  facultyMembers: FacultyMember[];
  total?: number;
}

interface FacultyStatsResponse {
  stats: DashboardStats;
}

interface EngagementsResponse {
  engagements: Array<{
    facultyId: string;
    facultyName: string;
    uploadsCount?: number;
    score?: number;
  }>;
}

interface StudentsResponse {
  students: Student[];
}

export interface StaffAdvisorDashboardData {
  stats: StaffStats;
  careerStats: CareerStats;
  students: Student[];
  batchCourseOverview: BatchCourseOverview;
}

function cloneFacultyDashboardData(
  data: FacultyDashboardData,
): FacultyDashboardData {
  return {
    stats: {
      ...data.stats,
      recentActivity: data.stats.recentActivity.map((item) => ({ ...item })),
    },
    facultyMembers: data.facultyMembers.map((member) => ({
      ...member,
      roles: Array.isArray(member.roles) ? [...member.roles] : member.roles,
      courses: Array.isArray(member.courses) ? [...member.courses] : [],
    })),
  };
}

/**
 * Fetch dashboard data from MongoDB via API
 */
async function fetchFromDashboardAPI<T>(endpoint: string): Promise<T> {
  const normalizeBaseUrl = (value: string | undefined) => {
    const normalized = String(value || "")
      .trim()
      .replace(/\/$/, "");

    if (!normalized) return "";

    // Ignore template placeholders that are easy to accidentally ship.
    if (/replace-with-backend-url/i.test(normalized)) {
      return "";
    }

    if (!/^https?:\/\//i.test(normalized)) {
      return "";
    }

    return normalized;
  };

  const backendUrlCandidates = [
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_URL),
    normalizeBaseUrl(process.env.BACKEND_URL),
  ]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  const localhostFallbacks = ["http://localhost:5010", "http://localhost:5000"];
  const baseUrlCandidates =
    backendUrlCandidates.length > 0
      ? backendUrlCandidates
      : process.env.NODE_ENV === "production"
        ? []
        : localhostFallbacks;

  if (baseUrlCandidates.length === 0) {
    throw new Error(
      "Dashboard API base URL is not configured. Set NEXT_PUBLIC_BACKEND_URL or BACKEND_URL in production.",
    );
  }

  const attemptErrors: string[] = [];

  for (const baseUrl of baseUrlCandidates) {
    const requestUrl = `${baseUrl}/api/dashboard${endpoint}`;
    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        return response.json();
      }

      let responseText = "";
      try {
        responseText = (await response.text()).slice(0, 200);
      } catch {
        responseText = "";
      }

      attemptErrors.push(
        `${requestUrl} -> ${response.status} ${response.statusText}${
          responseText ? ` (${responseText})` : ""
        }`,
      );
    } catch (error) {
      attemptErrors.push(
        `${requestUrl} -> ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  throw new Error(
    `Failed to fetch dashboard endpoint '${endpoint}'. Attempts: ${attemptErrors.join(" | ")}`,
  );
}

export async function getFacultyDashboardData(
  username?: string | null,
): Promise<FacultyDashboardData> {
  const normalizedUsername = normalizeIdentity(username);
  const cacheKey = normalizedUsername || "__anonymous__";
  const cachedEntry = facultyDashboardCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cloneFacultyDashboardData(cachedEntry.data);
  }

  try {
    // Fetch dashboard data from MongoDB
    const dashboardData =
      await fetchFromDashboardAPI<FacultyListResponse>("/faculty-list");
    let facultyMembers = dashboardData.facultyMembers || [];

    // If username specified, get their individual stats
    const stats: DashboardStats = {
      totalFiles: 0,
      totalReports: 0,
      pendingReports: 0,
      totalParticipants: 0,
      recentActivity: [],
    };

    if (username && facultyMembers.length > 0) {
      const selectedUser = facultyMembers.find((m) => {
        const normalizedName = normalizeIdentity(m.name);
        const normalizedEmail = normalizeIdentity(m.email);
        return (
          normalizedName === normalizedUsername ||
          normalizedEmail === normalizedUsername
        );
      });
      if (selectedUser) {
        try {
          const statsData = await fetchFromDashboardAPI<FacultyStatsResponse>(
            `/faculty-stats/${selectedUser.id}`,
          );
          Object.assign(stats, statsData.stats);
        } catch (error) {
          console.warn("Faculty stats lookup failed; using zero stats", {
            selectedUserId: selectedUser.id,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const data = {
      stats,
      facultyMembers,
    };

    facultyDashboardCache.set(cacheKey, {
      data: cloneFacultyDashboardData(data),
      expiresAt: Date.now() + FACULTY_DASHBOARD_CACHE_TTL_MS,
    });

    return data;
  } catch (error) {
    console.error("Error fetching faculty dashboard data:", error);
    // Fallback to empty data
    return {
      stats: {
        totalFiles: 0,
        totalReports: 0,
        pendingReports: 0,
        totalParticipants: 0,
        recentActivity: [],
      },
      facultyMembers: [],
    };
  }
}

export async function getAuditorDashboardData(): Promise<{
  stats: AuditorStats;
  facultyMembers: AuditorFacultyMember[];
}> {
  try {
    // Fetch engagement summaries from MongoDB.
    const engagements =
      await fetchFromDashboardAPI<EngagementsResponse>("/engagements");

    const stats: AuditorStats = {
      totalFiles: 0,
      totalReports: 0,
      approvedFiles: 0,
      pendingFiles: 0,
      rejectedFiles: 0,
      approvedReports: 0,
      totalFaculty: 0,
      pendingReports: 0,
      rejectedReports: 0,
      completionRate: 0,
    };

    const facultyMembers: AuditorFacultyMember[] = (
      engagements.engagements || []
    ).map((eng: any) => ({
      id: eng.facultyId,
      name: eng.facultyName,
      department: "",
      totalFiles: eng.uploadsCount ?? 0,
      totalReports: 0,
      approvedFiles: 0,
      approvedReports: 0,
      pendingFiles: 0,
      pendingReports: 0,
      rejectedFiles: 0,
      rejectedReports: 0,
      email: "",
      phone: "",
      experience: "",
      profileImageUrl: "",
      resumeUrl: "",
      resumeFileName: "",
    }));

    stats.totalFaculty = facultyMembers.length;
    stats.totalFiles = facultyMembers.reduce(
      (sum, faculty) => sum + (faculty.totalFiles || 0),
      0,
    );
    stats.completionRate = (engagements.engagements || []).length
      ? Math.round(
          (engagements.engagements || []).reduce(
            (sum, engagement) => sum + (engagement.score || 0),
            0,
          ) / (engagements.engagements || []).length,
        )
      : 0;

    return {
      stats,
      facultyMembers,
    };
  } catch (error) {
    console.error("Error fetching auditor dashboard data:", error);
    return {
      stats: {
        totalFaculty: 0,
        totalFiles: 0,
        totalReports: 0,
        approvedFiles: 0,
        approvedReports: 0,
        pendingFiles: 0,
        pendingReports: 0,
        rejectedFiles: 0,
        rejectedReports: 0,
        completionRate: 0,
      },
      facultyMembers: [],
    };
  }
}

export async function getStaffAdvisorDashboardData(
  advisorId?: string | null,
): Promise<StaffAdvisorDashboardData> {
  const normalizedAdvisorId = String(advisorId || "").trim();
  if (!normalizedAdvisorId) {
    return {
      stats: {
        totalStudents: 0,
        batchYear: "All",
        placedStudents: 0,
        inProcess: 0,
        averageCGPA: 0,
        averageAttendance: 0,
        totalFaculty: 0,
        approvedFiles: 0,
        approvedReports: 0,
      },
      careerStats: {
        totalInternships: 0,
        activeInternships: 0,
        completedProjects: 0,
        skillWorkshops: 0,
        campusInterviews: 0,
      },
      students: [],
      batchCourseOverview: {
        overall: {
          batchYear: "All",
          totalFiles: 0,
          approvedFiles: 0,
          inReviewFiles: 0,
          rejectedFiles: 0,
          completionRate: 0,
        },
        groups: [],
      },
    };
  }

  const cacheKey = normalizedAdvisorId;
  const cachedEntry = staffAdvisorDashboardCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return {
      ...cachedEntry.data,
      students: [...(cachedEntry.data.students || [])],
    };
  }

  try {
    // Fetch students and batch overview from MongoDB
    const studentsData = await fetchFromDashboardAPI<StudentsResponse>(
      `/students?advisorId=${encodeURIComponent(normalizedAdvisorId)}`,
    );

    const students = studentsData.students || [];
    const totalStudents = students.length;

    const stats: StaffStats = {
      totalStudents,
      batchYear: "All",
      placedStudents: 0,
      inProcess: 0,
      averageCGPA: 0,
      averageAttendance: 0,
      totalFaculty: 0,
      approvedFiles: 0,
      approvedReports: 0,
    };

    const careerStats: CareerStats = {
      totalInternships: 0,
      activeInternships: 0,
      completedProjects: 0,
      skillWorkshops: 0,
      campusInterviews: 0,
    };

    const batchCourseOverview: BatchCourseOverview = {
      overall: {
        batchYear: "All",
        totalFiles: 0,
        approvedFiles: 0,
        inReviewFiles: 0,
        rejectedFiles: 0,
        completionRate: 0,
      },
      groups: [],
    };

    const data: StaffAdvisorDashboardData = {
      stats,
      careerStats,
      students,
      batchCourseOverview,
    };

    staffAdvisorDashboardCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + STAFF_ADVISOR_DASHBOARD_CACHE_TTL_MS,
    });

    return data;
  } catch (error) {
    console.error("Error fetching staff advisor dashboard data:", error);
    return {
      stats: {
        totalStudents: 0,
        batchYear: "All",
        placedStudents: 0,
        inProcess: 0,
        averageCGPA: 0,
        averageAttendance: 0,
        totalFaculty: 0,
        approvedFiles: 0,
        approvedReports: 0,
      },
      careerStats: {
        totalInternships: 0,
        activeInternships: 0,
        completedProjects: 0,
        skillWorkshops: 0,
        campusInterviews: 0,
      },
      students: [],
      batchCourseOverview: {
        overall: {
          batchYear: "All",
          totalFiles: 0,
          approvedFiles: 0,
          inReviewFiles: 0,
          rejectedFiles: 0,
          completionRate: 0,
        },
        groups: [],
      },
    };
  }
}

export function clearDashboardCache() {
  facultyDashboardCache.clear();
  staffAdvisorDashboardCache.clear();
}
