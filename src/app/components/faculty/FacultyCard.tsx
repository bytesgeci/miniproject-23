import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronRight, Building, GraduationCap } from "lucide-react";
import { FacultyMember } from "../../types/faculty";

interface FacultyCardProps {
  faculty: FacultyMember;
  onSelect: (faculty: FacultyMember) => void;
}

export function FacultyCard({ faculty, onSelect }: FacultyCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(faculty)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
            {faculty.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{faculty.name}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              {faculty.role}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Building className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{faculty.department}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <GraduationCap className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{faculty.specialization}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Courses: {faculty.courses.length}</p>
          <div className="flex flex-wrap gap-1">
            {faculty.courses.slice(0, 2).map((course, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs bg-purple-50 truncate max-w-full"
              >
                {course.split(" - ")[0]}
              </Badge>
            ))}
            {faculty.courses.length > 2 && (
              <Badge variant="outline" className="text-xs bg-gray-50">
                +{faculty.courses.length - 2}
              </Badge>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full mt-4">
          View Portfolio
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
