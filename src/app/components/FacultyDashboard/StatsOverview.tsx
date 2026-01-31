import { FileText, Calendar, TrendingUp, Users } from "lucide-react";
import { StatCard } from "../faculty/StatCard";
import { DashboardStats } from "../../types/faculty";

interface StatsOverviewProps {
  stats: DashboardStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Course Files"
        value={stats.totalFiles}
        icon={FileText}
        backgroundColor="bg-blue-100"
        iconColor="text-blue-600"
      />
      <StatCard
        title="Event Reports"
        value={stats.totalReports}
        icon={Calendar}
        backgroundColor="bg-green-100"
        iconColor="text-green-600"
      />
      <StatCard
        title="Pending Reviews"
        value={stats.pendingReports}
        icon={TrendingUp}
        backgroundColor="bg-orange-100"
        iconColor="text-orange-600"
      />
      <StatCard
        title="Total Participants"
        value={stats.totalParticipants}
        icon={Users}
        backgroundColor="bg-purple-100"
        iconColor="text-purple-600"
      />
    </div>
  );
}
