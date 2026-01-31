import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { User, BookOpen, Calendar } from "lucide-react";
import { CourseFile } from "./types";

interface FileInfoSidebarProps {
  file: CourseFile;
}

export function FileInfoSidebar({ file }: FileInfoSidebarProps) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">File Information</h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <User className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">Faculty</p>
            <p className="text-sm text-gray-900">{file.facultyName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <BookOpen className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">Department</p>
            <p className="text-sm text-gray-900">{file.department}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <BookOpen className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">Course</p>
            <p className="text-sm text-gray-900">{file.courseName}</p>
            <p className="text-xs text-gray-600">{file.courseCode}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">Semester</p>
            <p className="text-sm text-gray-900">{file.semester}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">Upload Date</p>
            <p className="text-sm text-gray-900">{file.uploadDate}</p>
          </div>
        </div>

        {file.status && (
          <div className="flex items-start gap-3">
            <div className="h-4 w-4 mt-1 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600">Status</p>
              <Badge
                variant={
                  file.status === "Approved"
                    ? "default"
                    : file.status === "Pending"
                      ? "secondary"
                      : "outline"
                }
              >
                {file.status}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
