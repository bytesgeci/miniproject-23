import { useState } from "react";
import { FacultyPortfolio } from "./FacultyPortfolio";
import { DashboardHeader } from "./DashboardHeader";
import { StatsOverview } from "./StatsOverview";
import { PendingAlerts } from "./PendingAlerts";
import { ActivitySection } from "./ActivitySection";
import { AllFacultyMembers } from "./AllFacultyMembers";
import { FacultyMember } from "../../types/faculty";
import { mockStats, mockFacultyMembers } from "./mockData";

export function FacultyDashboard() {
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);

  if (selectedFaculty) {
    return <FacultyPortfolio faculty={selectedFaculty} onBack={() => setSelectedFaculty(null)} />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <StatsOverview stats={mockStats} />
      <PendingAlerts pendingReports={mockStats.pendingReports} />
      <ActivitySection 
        activities={mockStats.recentActivity} 
        facultyMembers={mockFacultyMembers} 
        onSelectFaculty={setSelectedFaculty}
      />
      <AllFacultyMembers 
        facultyMembers={mockFacultyMembers} 
        onSelectFaculty={setSelectedFaculty}
      />
    </div>
  );
}
