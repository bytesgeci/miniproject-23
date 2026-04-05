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
import { readJsonFile } from "@/lib/jsonDb";

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

const STAFF_ADVISOR_DASHBOARD_CACHE_TTL_MS = 30000;
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

interface PendingAuditFacultyResponse {
  pendingFaculty: Array<{
    facultyId: string;
    pendingFiles?: number;
    pendingReports?: number;
    totalPending?: number;
  }>;
  totalFaculty?: number;
}

interface LocalCourseFileRecord {
  facultyId?: string;
  status?: string;
  fileName?: string;
  courseCode?: string;
  uploadDate?: string;
  createdAt?: string;
}

interface LocalEventReportRecord {
  facultyId?: string;
  status?: string;
  participants?: number;
  eventName?: string;
  createdAt?: string;
  submittedDate?: string;
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

function normalizeAuditStatus(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatTimeAgo(timestamp?: string | null) {
  if (!timestamp) return "Just now";

  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return "Just now";

  const diffMs = Date.now() - time;
  if (diffMs < 60_000) return "Just now";

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

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

function buildUserIdentityCandidates(user: {
  id?: string;
  username?: string;
  email?: string;
  firebaseUid?: string;
}) {
  const values = [user.id, user.username, user.email, user.firebaseUid];
  const candidates = new Set<string>();

  values.forEach((value) => {
    const normalized = normalizeIdentity(value);
    if (!normalized) return;
    normalizeIdForMatching(normalized).forEach((item) => candidates.add(item));
  });

  return candidates;
}

async function buildLocalFacultyCourseFileStats(
  identityCandidates: Set<string>,
) {
  const files = await readJsonFile<LocalCourseFileRecord[]>("courseFiles.json");

  const facultyFiles = (files || []).filter((file) => {
    if (!file) return false;
    const fileId = String(file?.facultyId || "").trim();
    if (!fileId) return false;

    const normalizedFileId = normalizeIdForMatching(fileId);
    return normalizedFileId.some((fid) => identityCandidates.has(fid));
  });

  const pendingFiles = facultyFiles.filter((file) => {
    const status = normalizeAuditStatus(file?.status);
    return ["pending", "submitted", "in_review", "in review"].includes(status);
  }).length;

  const recentActivity = facultyFiles
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.uploadDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.uploadDate || b.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 5)
    .map((file) => ({
      action: "Uploaded",
      item: file.fileName || file.courseCode || "Course File",
      time: formatTimeAgo(file.uploadDate || file.createdAt),
    }));

  return {
    totalFiles: facultyFiles.length,
    pendingFiles,
    recentActivity,
  };
}

async function buildLocalFacultyDashboardData(
  username?: string | null,
): Promise<FacultyDashboardData> {
  const normalizedUsername = normalizeIdentity(username);
  const users = await getAllUsers();

  // Store a mapping of serialized ID to original user for ID matching
  const userIdMap = new Map<
    string,
    { serializedId: string; originalUser: (typeof users)[0] }
  >();

  const facultyMembers = users
    .filter((user) => {
      const primaryRole = normalizeRoleInput(user.role);
      const normalizedRoles = Array.isArray(user.roles)
        ? (user.roles
            .map((role) => normalizeRoleInput(role))
            .filter(Boolean) as string[])
        : [];

      return primaryRole === "faculty" || normalizedRoles.includes("faculty");
    })
    .map((user) => {
      const normalizedRoles = Array.isArray(user.roles)
        ? (user.roles
            .map((role) => normalizeRoleInput(role))
            .filter(Boolean) as string[])
        : [];

      const serializedId = serializeId(user.id);
      userIdMap.set(serializedId, { serializedId, originalUser: user });

      return {
        id: serializedId,
        username: String(user.username || ""),
        name: String(user.name || user.username || "Faculty"),
        department: String(user.department || ""),
        role: String(user.role || "faculty"),
        roles: normalizedRoles,
        isStaffAdvisor: normalizedRoles.includes("staff-advisor"),
        email: String(user.email || user.username || ""),
        phone: String(user.phone || ""),
        courses: [],
        specialization: "",
        experience: "",
        profileImageUrl: "",
        resumeUrl: "",
        resumeFileName: "",
      };
    });

  const stats: DashboardStats = {
    totalFiles: 0,
    totalReports: 0,
    pendingReports: 0,
    totalParticipants: 0,
    recentActivity: [],
  };

  const selectedUser = facultyMembers.find((member) => {
    const normalizedUsernameField = normalizeIdentity(member.username);
    const normalizedName = normalizeIdentity(member.name);
    const normalizedEmail = normalizeIdentity(member.email);
    return (
      normalizedUsernameField === normalizedUsername ||
      normalizedName === normalizedUsername ||
      normalizedEmail === normalizedUsername
    );
  });

  if (selectedUser) {
    // Get the original user to access the raw ID
    const userInfo = userIdMap.get(selectedUser.id);
    const originalUser = userInfo?.originalUser;

    const identityCandidates = buildUserIdentityCandidates({
      id: String(originalUser?.id ?? selectedUser.id),
      username: String(originalUser?.username ?? selectedUser.username ?? ""),
      email: String(originalUser?.email ?? selectedUser.email ?? ""),
      firebaseUid: String(originalUser?.firebaseUid ?? ""),
    });

    const [localCourseStats, eventReports] = await Promise.all([
      buildLocalFacultyCourseFileStats(identityCandidates),
      readJsonFile<LocalEventReportRecord[]>("eventReports.json"),
    ]);

    const facultyReports = (eventReports || []).filter((report) => {
      if (!report?.facultyId) return false;
      const reportFacultyId = String(report.facultyId).trim();
      if (!reportFacultyId) return false;

      const normalizedReportIds = normalizeIdForMatching(reportFacultyId);
      return normalizedReportIds.some((rid) => identityCandidates.has(rid));
    });

    stats.totalFiles = localCourseStats.totalFiles;
    stats.totalReports = facultyReports.length;
    stats.pendingReports = localCourseStats.pendingFiles;
    stats.totalParticipants = facultyReports.reduce(
      (sum, report) => sum + (Number(report.participants) || 0),
      0,
    );
    stats.recentActivity = localCourseStats.recentActivity;
  }

  return { stats, facultyMembers };
}

async function buildPendingMapFromLocalData() {
  const [courseFiles, eventReports] = await Promise.all([
    readJsonFile<LocalCourseFileRecord[]>("courseFiles.json"),
    readJsonFile<LocalEventReportRecord[]>("eventReports.json"),
  ]);

  const pendingByFacultyId = new Map<
    string,
    { pendingFiles: number; pendingReports: number }
  >();

  for (const file of courseFiles || []) {
    const facultyId = String(file?.facultyId || "").trim();
    if (!facultyId) continue;

    const status = normalizeAuditStatus(file?.status);
    if (!["pending", "submitted", "in_review", "in review"].includes(status)) {
      continue;
    }

    const current = pendingByFacultyId.get(facultyId) || {
      pendingFiles: 0,
      pendingReports: 0,
    };
    current.pendingFiles += 1;
    pendingByFacultyId.set(facultyId, current);
  }

  for (const report of eventReports || []) {
    const facultyId = String(report?.facultyId || "").trim();
    if (!facultyId) continue;

    const status = normalizeAuditStatus(report?.status);
    if (!["pending", "submitted", "in_review", "in review"].includes(status)) {
      continue;
    }

    const current = pendingByFacultyId.get(facultyId) || {
      pendingFiles: 0,
      pendingReports: 0,
    };
    current.pendingReports += 1;
    pendingByFacultyId.set(facultyId, current);
  }

  return pendingByFacultyId;
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
        cache: "no-store",
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
  const normalizeBaseUrl = (value: string | undefined) => {
    const normalized = String(value || "")
      .trim()
      .replace(/\/$/, "");

    if (!normalized) return "";
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
  ].filter(Boolean);

  if (backendUrlCandidates.length === 0) {
    return buildLocalFacultyDashboardData(username);
  }

  const normalizedUsername = normalizeIdentity(username);

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
        const normalizedUsernameField = normalizeIdentity(m.username);
        const normalizedName = normalizeIdentity(m.name);
        const normalizedEmail = normalizeIdentity(m.email);
        return (
          normalizedUsernameField === normalizedUsername ||
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

        try {
          const identityCandidates = buildUserIdentityCandidates({
            id: String(selectedUser.id ?? ""),
            username: String(selectedUser.username ?? ""),
            email: String(selectedUser.email ?? ""),
          });
          const localCourseStats =
            await buildLocalFacultyCourseFileStats(identityCandidates);
          stats.totalFiles = localCourseStats.totalFiles;
          stats.pendingReports = localCourseStats.pendingFiles;
          if (localCourseStats.recentActivity.length > 0) {
            stats.recentActivity = localCourseStats.recentActivity;
          }
        } catch (error) {
          console.warn("Local faculty course-file stats lookup failed", {
            selectedUserId: selectedUser.id,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return {
      stats,
      facultyMembers,
    };
  } catch (error) {
    console.error(
      "Error fetching faculty dashboard data from backend API:",
      error,
    );

    try {
      return await buildLocalFacultyDashboardData(username);
    } catch (fallbackError) {
      console.error(
        "Fallback faculty dashboard data load failed:",
        fallbackError,
      );
    }

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
    let engagements: EngagementsResponse = { engagements: [] };
    try {
      engagements =
        await fetchFromDashboardAPI<EngagementsResponse>("/engagements");
    } catch (error) {
      console.warn("Engagement fetch failed; proceeding with local fallbacks", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

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

    let facultyMembers: AuditorFacultyMember[] = (
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

    // Hosted fallback: if engagement list is empty, still surface faculty users
    // so auditor panels are not blank when there are no uploads yet.
    if (facultyMembers.length === 0) {
      try {
        const dashboardFaculty =
          await fetchFromDashboardAPI<FacultyListResponse>("/faculty-list");
        facultyMembers = (dashboardFaculty.facultyMembers || []).map(
          (member) => ({
            id: member.id,
            name: member.name,
            department: member.department || "",
            totalFiles: 0,
            totalReports: 0,
            approvedFiles: 0,
            approvedReports: 0,
            pendingFiles: 0,
            pendingReports: 0,
            rejectedFiles: 0,
            rejectedReports: 0,
            email: member.email || "",
            phone: member.phone || "",
            experience: member.experience || "",
            profileImageUrl: member.profileImageUrl || "",
            resumeUrl: member.resumeUrl || "",
            resumeFileName: member.resumeFileName || "",
          }),
        );
      } catch {
        const users = await getAllUsers();
        facultyMembers = users
          .filter((user) => {
            const primaryRole = normalizeRoleInput(user.role);
            const normalizedRoles = Array.isArray(user.roles)
              ? (user.roles
                  .map((role) => normalizeRoleInput(role))
                  .filter(Boolean) as string[])
              : [];

            return (
              primaryRole === "faculty" || normalizedRoles.includes("faculty")
            );
          })
          .map((user) => ({
            id: serializeId(user.id),
            name: String(user.name || user.username || "Faculty"),
            department: String(user.department || ""),
            totalFiles: 0,
            totalReports: 0,
            approvedFiles: 0,
            approvedReports: 0,
            pendingFiles: 0,
            pendingReports: 0,
            rejectedFiles: 0,
            rejectedReports: 0,
            email: String(user.email || user.username || ""),
            phone: String(user.phone || ""),
            experience: "",
            profileImageUrl: "",
            resumeUrl: "",
            resumeFileName: "",
          }));
      }
    }

    // Enforce auditor visibility rule: only show faculty with pending audits.
    try {
      let pendingByFacultyId = new Map<
        string,
        { pendingFiles: number; pendingReports: number; totalPending: number }
      >();

      const pendingAuditData =
        await fetchFromDashboardAPI<PendingAuditFacultyResponse>(
          "/pending-audit-faculty",
        );

      pendingByFacultyId = new Map(
        (pendingAuditData.pendingFaculty || []).map((row) => [
          String(row.facultyId || ""),
          {
            pendingFiles: row.pendingFiles ?? 0,
            pendingReports: row.pendingReports ?? 0,
            totalPending: row.totalPending ?? 0,
          },
        ]),
      );

      if (pendingByFacultyId.size === 0) {
        const localPending = await buildPendingMapFromLocalData();
        pendingByFacultyId = new Map(
          [...localPending.entries()].map(([facultyId, counts]) => [
            facultyId,
            {
              pendingFiles: counts.pendingFiles,
              pendingReports: counts.pendingReports,
              totalPending: counts.pendingFiles + counts.pendingReports,
            },
          ]),
        );
      }

      facultyMembers = facultyMembers
        .map((member) => {
          const pending = pendingByFacultyId.get(String(member.id || ""));
          return {
            ...member,
            pendingFiles: pending?.pendingFiles ?? 0,
            pendingReports: pending?.pendingReports ?? 0,
          };
        })
        .filter(
          (member) =>
            (member.pendingFiles || 0) > 0 || (member.pendingReports || 0) > 0,
        );

      stats.pendingFiles = facultyMembers.reduce(
        (sum, member) => sum + (member.pendingFiles || 0),
        0,
      );
      stats.pendingReports = facultyMembers.reduce(
        (sum, member) => sum + (member.pendingReports || 0),
        0,
      );
    } catch (error) {
      console.warn(
        "Pending audit filter fetch failed; using legacy auditor list",
        {
          message: error instanceof Error ? error.message : String(error),
        },
      );

      try {
        const localPending = await buildPendingMapFromLocalData();
        facultyMembers = facultyMembers
          .map((member) => {
            const pending = localPending.get(String(member.id || ""));
            return {
              ...member,
              pendingFiles: pending?.pendingFiles ?? 0,
              pendingReports: pending?.pendingReports ?? 0,
            };
          })
          .filter(
            (member) =>
              (member.pendingFiles || 0) > 0 ||
              (member.pendingReports || 0) > 0,
          );

        stats.pendingFiles = facultyMembers.reduce(
          (sum, member) => sum + (member.pendingFiles || 0),
          0,
        );
        stats.pendingReports = facultyMembers.reduce(
          (sum, member) => sum + (member.pendingReports || 0),
          0,
        );
      } catch (localError) {
        console.warn("Local pending fallback failed", {
          message:
            localError instanceof Error
              ? localError.message
              : String(localError),
        });
      }
    }

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
  staffAdvisorDashboardCache.clear();
}
