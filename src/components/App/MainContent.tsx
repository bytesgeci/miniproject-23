import { LayoutDashboard, FileText, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FacultyDashboard } from "@/components/FacultyDashboard";
import { CourseFileManager } from "@/components/CourseFileManager";
import { EventReportManager } from "@/components/EventReportManager";
import { AuditorDashboard } from "@/components/AuditorDashboard";
import { StaffAdvisorDashboard } from "@/components/StaffAdvisorDashboard";
import { UserRole } from "./config";

interface MainContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
}

export function MainContent({ activeTab, onTabChange, userRole }: MainContentProps) {
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

        <TabsContent value="dashboard" className="space-y-6">
          {userRole === "faculty" && <FacultyDashboard />}
          {userRole === "auditor" && <AuditorDashboard />}
          {userRole === "staff-advisor" && <StaffAdvisorDashboard />}
        </TabsContent>

        {/* Only render these tabs for faculty */}
        {userRole === "faculty" && (
          <>
            <TabsContent value="files" className="space-y-6">
              <CourseFileManager />
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <EventReportManager />
            </TabsContent>
          </>
        )}
      </Tabs>
    </main>
  );
}
