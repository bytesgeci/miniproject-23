import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CareerStats } from "./types";

interface CareerExplorationStatsProps {
  careerStats: CareerStats;
}

export function CareerExplorationStats({ careerStats }: CareerExplorationStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Career Exploration Stats</CardTitle>
        <CardDescription>Student career development activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{careerStats.totalInternships}</div>
            <p className="text-xs text-gray-600 mt-1">Total Internships</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{careerStats.activeInternships}</div>
            <p className="text-xs text-gray-600 mt-1">Active Now</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{careerStats.completedProjects}</div>
            <p className="text-xs text-gray-600 mt-1">Projects Done</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{careerStats.skillWorkshops}</div>
            <p className="text-xs text-gray-600 mt-1">Skill Workshops</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Campus Interviews</span>
            <Badge variant="outline">{careerStats.campusInterviews} Scheduled</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
