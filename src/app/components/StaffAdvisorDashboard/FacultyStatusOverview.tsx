import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { DashboardStats } from "./types";
import { FileText, Calendar } from "lucide-react";

interface FacultyStatusOverviewProps {
  stats: DashboardStats;
}

export function FacultyStatusOverview({ stats }: FacultyStatusOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Status Overview</CardTitle>
        <CardDescription>Course files and event reports status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Course Files</p>
                <p className="text-xs text-gray-500">{stats.totalFaculty} faculty members</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {stats.approvedFiles} Approved
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Event Reports</p>
                <p className="text-xs text-gray-500">Community engagement</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {stats.approvedReports} Approved
            </Badge>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Documentation Completion</span>
              <span className="font-medium">87%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: "87%" }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
