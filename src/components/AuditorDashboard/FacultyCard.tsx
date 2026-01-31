import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ChevronRight } from "lucide-react";
import { FacultyMember } from "./types";
import { FacultyBadges } from "./FacultyBadges";

interface FacultyCardProps {
  faculty: FacultyMember;
  onClick: (faculty: FacultyMember) => void;
}

export function FacultyCard({ faculty, onClick }: FacultyCardProps) {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => onClick(faculty)}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              {faculty.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{faculty.name}</p>
              <p className="text-sm text-gray-500">{faculty.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <FacultyBadges faculty={faculty} />

            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Review
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
