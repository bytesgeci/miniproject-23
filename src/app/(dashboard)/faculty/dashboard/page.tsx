"use client";

import { useEffect, useMemo, useState } from "react";
import { FacultyDashboard } from "@/components/FacultyDashboard";
import { FacultySectionTabs } from "@/components/faculty/FacultySectionTabs";
import { useAuth } from "@/context/AuthContext";
import type { DashboardStats, FacultyMember } from "@/types/faculty";

const EMPTY_STATS: DashboardStats = {
  totalFiles: 0,
  totalReports: 0,
  pendingReports: 0,
  totalParticipants: 0,
  recentActivity: [],
};

const FACULTY_DASHBOARD_CACHE_TTL_MS = 30_000;

let facultyDashboardPageCache: {
  key: string;
  stats: DashboardStats;
  facultyMembers: FacultyMember[];
  expiresAt: number;
} | null = null;

function readFacultyDashboardCache(cacheKey: string) {
  if (!facultyDashboardPageCache) {
    return null;
  }

  if (facultyDashboardPageCache.key !== cacheKey) {
    return null;
  }

  if (facultyDashboardPageCache.expiresAt <= Date.now()) {
    facultyDashboardPageCache = null;
    return null;
  }

  return facultyDashboardPageCache;
}

function writeFacultyDashboardCache(
  cacheKey: string,
  stats: DashboardStats,
  facultyMembers: FacultyMember[],
) {
  facultyDashboardPageCache = {
    key: cacheKey,
    stats,
    facultyMembers,
    expiresAt: Date.now() + FACULTY_DASHBOARD_CACHE_TTL_MS,
  };
}

export default function FacultyDashboardPage() {
  const { user } = useAuth();

  const requestUrl = useMemo(() => {
    if (!user?.username) {
      return "/api/dashboard/faculty";
    }

    return `/api/dashboard/faculty?username=${encodeURIComponent(user.username)}`;
  }, [user?.username]);

  const cachedPayload = readFacultyDashboardCache(requestUrl);

  const [stats, setStats] = useState<DashboardStats>(
    cachedPayload?.stats ?? EMPTY_STATS,
  );
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>(
    cachedPayload?.facultyMembers ?? [],
  );
  const [isLoading, setIsLoading] = useState(!cachedPayload);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const load = async ({ showLoading }: { showLoading: boolean }) => {
      if (showLoading && isActive) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(requestUrl, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !isActive) {
          return;
        }

        if (data?.stats) {
          setStats(data.stats);
          writeFacultyDashboardCache(
            requestUrl,
            data.stats,
            Array.isArray(data?.facultyMembers) ? data.facultyMembers : [],
          );
        }

        if (Array.isArray(data?.facultyMembers)) {
          setFacultyMembers(data.facultyMembers);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Faculty dashboard initial load error:", error);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    const hasFreshCache = Boolean(readFacultyDashboardCache(requestUrl));
    void load({ showLoading: !hasFreshCache });

    const onDataUpdated = () => {
      void load({ showLoading: false });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("dashboard:data-updated", onDataUpdated);
    }

    return () => {
      isActive = false;
      controller.abort();
      if (typeof window !== "undefined") {
        window.removeEventListener("dashboard:data-updated", onDataUpdated);
      }
    };
  }, [requestUrl]);

  return (
    <main className="space-y-6">
      <FacultySectionTabs>
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
          <FacultyDashboard stats={stats} facultyMembers={facultyMembers} />
        )}
      </FacultySectionTabs>
    </main>
  );
}
