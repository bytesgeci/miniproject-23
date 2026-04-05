"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, FileText, Calendar } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { FacultyDashboard } from "../../components/FacultyDashboard";
import { CourseFileManager } from "../components/CourseFileManager";
import { EventReportManager } from "../components/EventReportManager";
import { AuditorDashboard } from "../../components/AuditorDashboard";
import { StaffAdvisorDashboard } from "../../components/StaffAdvisorDashboard";
import type { UserRole } from "@/lib/roles";
import type { DashboardStats, FacultyMember } from "../types/faculty";
import type {
  DashboardStats as AuditorStats,
  FacultyMember as AuditorFacultyMember,
  RecentReview,
} from "../components/AuditorDashboard/types";
import type {
  BatchCourseOverview,
  CareerStats,
  DashboardStats as StaffStats,
  Student,
} from "../../components/StaffAdvisorDashboard/types";
import { useAuth } from "@/context/AuthContext";

interface MainContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
}

export function MainContent({
  activeTab,
  onTabChange,
  userRole,
}: MainContentProps) {
  const { user } = useAuth();
  const [facultyData, setFacultyData] = useState<{
    stats: DashboardStats;
    facultyMembers: FacultyMember[];
  } | null>(null);
  const [auditorData, setAuditorData] = useState<{
    stats: AuditorStats;
    facultyMembers: AuditorFacultyMember[];
    recentReviews: RecentReview[];
  } | null>(null);
  const [staffData, setStaffData] = useState<{
    stats: StaffStats;
    careerStats: CareerStats;
    students: Student[];
    batchCourseOverview: BatchCourseOverview;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (userRole === "faculty") {
        const url = user?.username
          ? `/api/dashboard/faculty?username=${encodeURIComponent(user.username)}`
          : "/api/dashboard/faculty";
        const response = await fetch(url);
        const data = await response.json();
        setFacultyData(data);
      }
      if (userRole === "auditor") {
        const response = await fetch("/api/dashboard/auditor");
        const data = await response.json();
        setAuditorData(data);
      }
      if (userRole === "staff-advisor") {
        const response = await fetch("/api/dashboard/staff-advisor");
        const data = await response.json();
        setStaffData(data);
      }
    };

    fetchData().catch((error) => {
      console.error("Dashboard load error:", error);
    });
  }, [userRole]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        {/* Only show tabs for Faculty role */}
        {userRole === "faculty" && (
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Course Files</span>
              <span className="sm:hidden">Files</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Event Reports</span>
              <span className="sm:hidden">Events</span>
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="dashboard" className="space-y-6" forceMount>
          {userRole === "faculty" && facultyData && (
            <FacultyDashboard
              stats={facultyData.stats}
              facultyMembers={facultyData.facultyMembers}
            />
          )}
          {userRole === "auditor" && auditorData && (
            <AuditorDashboard
              stats={auditorData.stats}
              facultyMembers={auditorData.facultyMembers}
              recentReviews={auditorData.recentReviews}
            />
          )}
          {userRole === "staff-advisor" && staffData && (
            <StaffAdvisorDashboard
              stats={staffData.stats}
              careerStats={staffData.careerStats}
              students={staffData.students}
              batchCourseOverview={staffData.batchCourseOverview}
            />
          )}
        </TabsContent>

        {/* Only render these tabs for faculty */}
        {userRole === "faculty" && (
          <>
            <TabsContent value="files" className="space-y-6" forceMount>
              <CourseFileManager />
            </TabsContent>

            <TabsContent value="events" className="space-y-6" forceMount>
              <EventReportManager />
            </TabsContent>
          </>
        )}
      </Tabs>
    </main>
  );
}
