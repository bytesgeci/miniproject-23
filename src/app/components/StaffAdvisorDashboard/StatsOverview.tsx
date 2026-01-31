import { Card, CardContent } from "../ui/card";
import { DashboardStats } from "./types";
import { GraduationCap, UserCheck, TrendingUp, BookOpen } from "lucide-react";

interface StatsOverviewProps {
  stats: DashboardStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <div className="text-2xl mt-1">{stats.totalStudents}</div>
              <p className="text-xs text-gray-500 mt-1">Batch {stats.batchYear}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Placed Students</p>
              <div className="text-2xl mt-1">{stats.placedStudents}</div>
              <p className="text-xs text-green-600 mt-1">
                {Math.round((stats.placedStudents / stats.totalStudents) * 100)}% placement rate
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average CGPA</p>
              <div className="text-2xl mt-1">{stats.averageCGPA}</div>
              <p className="text-xs text-gray-500 mt-1">
                Batch performance
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Attendance</p>
              <div className="text-2xl mt-1">{stats.averageAttendance}%</div>
              <p className="text-xs text-gray-500 mt-1">
                Overall batch
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
