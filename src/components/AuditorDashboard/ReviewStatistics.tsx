import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "./types";

interface ReviewStatisticsProps {
  stats: DashboardStats;
}

export function ReviewStatistics({ stats }: ReviewStatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Statistics</CardTitle>
        <CardDescription>Overall submission quality metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Course Files Approved</span>
              <span className="text-sm font-medium">{Math.round((stats.approvedFiles / stats.totalFiles) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(stats.approvedFiles / stats.totalFiles) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Event Reports Approved</span>
              <span className="text-sm font-medium">{Math.round((stats.approvedReports / stats.totalReports) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(stats.approvedReports / stats.totalReports) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Overall Completion Rate</span>
              <span className="text-sm font-medium">{stats.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
