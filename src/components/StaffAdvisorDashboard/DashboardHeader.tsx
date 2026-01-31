import { Users } from "lucide-react";
import { DashboardStats } from "./types";

interface DashboardHeaderProps {
  stats: DashboardStats;
}

export function DashboardHeader({ stats }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
        <Users className="h-6 w-6 text-green-600" />
      </div>
      <div>
        <h2>Staff Advisor Dashboard</h2>
        <p className="text-gray-600">Batch {stats.batchYear} - Student Management & Career Development</p>
      </div>
    </div>
  );
}
