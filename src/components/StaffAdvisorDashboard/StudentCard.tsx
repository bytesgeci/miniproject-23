import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Student } from "./types";
import { Briefcase, Target, ChevronRight } from "lucide-react";

interface StudentCardProps {
  student: Student;
  onViewDetails: (student: Student) => void;
}

export function StudentCard({ student, onViewDetails }: StudentCardProps) {
  const getPlacementColor = (status: string) => {
    switch (status) {
      case "Placed": return "bg-green-100 text-green-800";
      case "In Process": return "bg-blue-100 text-blue-800";
      case "Not Started": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => onViewDetails(student)}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{student.name}</p>
                <Badge className={getPlacementColor(student.placementStatus)}>
                  {student.placementStatus}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {student.rollNumber} • {student.semester} Semester
              </p>
              {student.companyName && (
                <p className="text-xs text-green-600 mt-1">
                  <Briefcase className="h-3 w-3 inline mr-1" />
                  {student.companyName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">CGPA</p>
              <p className="font-medium">{student.cgpa}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Attendance</p>
              <p className="font-medium">{student.attendance}%</p>
            </div>
            <div className="text-center min-w-[120px]">
              <p className="text-xs text-gray-500 mb-1">Career Interest</p>
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                {student.careerInterest}
              </Badge>
            </div>

            <Button variant="outline" size="sm">
              View Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
