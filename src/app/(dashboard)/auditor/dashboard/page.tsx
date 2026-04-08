"use client";

import { useEffect, useState } from "react";
import { AuditorDashboard } from "@/components/AuditorDashboard";
import type {
  DashboardStats,
  FacultyMember,
  RecentReview,
} from "@/components/AuditorDashboard/types";
import { fetchJsonCached } from "@/lib/clientFetchCache";

const EMPTY_STATS: DashboardStats = {
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
};

interface AuditorDashboardResponse {
  stats?: DashboardStats;
  facultyMembers?: FacultyMember[];
  recentReviews?: RecentReview[];
}

export default function AuditorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await fetchJsonCached<AuditorDashboardResponse>(
          "dashboard:auditor",
          "/api/dashboard/auditor",
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
        if (Array.isArray(data?.facultyMembers)) {
          setFacultyMembers(data.facultyMembers);
        }
        if (Array.isArray(data?.recentReviews)) {
          setRecentReviews(data.recentReviews);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Auditor dashboard initial load error:", error);
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
  }, []);

  return (
    <main className="space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-8 w-56 animate-pulse rounded-md bg-slate-200" />
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
        <AuditorDashboard
          stats={stats}
          facultyMembers={facultyMembers}
          recentReviews={recentReviews}
        />
      )}
    </main>
  );
}
