import { useState } from "react";
import { FacultyAuditPortfolio } from "./FacultyAuditPortfolio";
import { DashboardHeader } from "./DashboardHeader";
import { StatsOverview } from "./StatsOverview";
import { PendingReviewsAlert } from "./PendingReviewsAlert";
import { ReviewStatistics } from "./ReviewStatistics";
import { RecentActivity } from "./RecentActivity";
import { FacultySubmissionStatus } from "./FacultySubmissionStatus";
import { FacultyMember } from "./types";
import { mockStats, mockFacultyMembers, mockRecentReviews } from "./mockData";

export function AuditorDashboard() {
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);

  if (selectedFaculty) {
    return <FacultyAuditPortfolio faculty={selectedFaculty} onBack={() => setSelectedFaculty(null)} />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <StatsOverview stats={mockStats} />
      <PendingReviewsAlert stats={mockStats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReviewStatistics stats={mockStats} />
        <RecentActivity reviews={mockRecentReviews} />
      </div>

      <FacultySubmissionStatus 
        facultyMembers={mockFacultyMembers} 
        onSelectFaculty={setSelectedFaculty}
      />
    </div>
  );
}
