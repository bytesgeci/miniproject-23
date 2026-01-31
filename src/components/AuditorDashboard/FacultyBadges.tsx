import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";
import { FacultyMember } from "./types";

interface FacultyBadgesProps {
  faculty: FacultyMember;
}

export function FacultyBadges({ faculty }: FacultyBadgesProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Course Files */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">Course Files</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {faculty.approvedFiles}
          </Badge>
          {faculty.pendingFiles > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {faculty.pendingFiles}
            </Badge>
          )}
        </div>
      </div>

      {/* Event Reports */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">Event Reports</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {faculty.approvedReports}
          </Badge>
          {faculty.pendingReports > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {faculty.pendingReports}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
