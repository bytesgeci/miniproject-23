"use client";

import { useEffect, useMemo, useState } from "react";
import { StaffAdvisorDashboard } from "@/components/StaffAdvisorDashboard";
import { useAuth } from "@/context/AuthContext";
import type {
  BatchCourseOverview,
  CareerStats,
  DashboardStats,
  Student,
} from "@/components/StaffAdvisorDashboard/types";
import { fetchJsonCached } from "@/lib/clientFetchCache";

const EMPTY_STATS: DashboardStats = {
  totalStudents: 0,
  batchYear: "",
  placedStudents: 0,
  inProcess: 0,
  averageCGPA: 0,
  averageAttendance: 0,
  totalFaculty: 0,
  approvedFiles: 0,
  approvedReports: 0,
};

const EMPTY_CAREER_STATS: CareerStats = {
  totalInternships: 0,
  activeInternships: 0,
  completedProjects: 0,
  skillWorkshops: 0,
  campusInterviews: 0,
};

const EMPTY_BATCH_OVERVIEW: BatchCourseOverview = {
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

interface StaffAdvisorDashboardResponse {
  stats?: DashboardStats;
  careerStats?: CareerStats;
  students?: Student[];
  batchCourseOverview?: BatchCourseOverview;
}

export default function StaffAdvisorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [careerStats, setCareerStats] =
    useState<CareerStats>(EMPTY_CAREER_STATS);
  const [students, setStudents] = useState<Student[]>([]);
  const [batchCourseOverview, setBatchCourseOverview] =
    useState<BatchCourseOverview>(EMPTY_BATCH_OVERVIEW);
  const [isLoading, setIsLoading] = useState(true);

  const requestUrl = useMemo(() => {
    if (!user?.username) {
      return "/api/dashboard/staff-advisor";
    }

    return `/api/dashboard/staff-advisor?username=${encodeURIComponent(user.username)}`;
  }, [user?.username]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await fetchJsonCached<StaffAdvisorDashboardResponse>(
          `dashboard:staff-advisor:${requestUrl}`,
          requestUrl,
          {
            ttlMs: 20_000,
            signal: controller.signal,
          },
        );

        if (!isActive) {
          return;
        }

        if (data?.stats) {
          setStats(data.stats);
        }
        if (data?.careerStats) {
          setCareerStats(data.careerStats);
        }
        if (Array.isArray(data?.students)) {
          setStudents(data.students);
        }
        if (data?.batchCourseOverview) {
          setBatchCourseOverview(data.batchCourseOverview);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Staff advisor dashboard initial load error:", error);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [requestUrl]);

  return (
    <main className="space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-8 w-64 animate-pulse rounded-md bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </div>
      ) : (
        <StaffAdvisorDashboard
          stats={stats}
          careerStats={careerStats}
          students={students}
          batchCourseOverview={batchCourseOverview}
        />
      )}
    </main>
  );
}
