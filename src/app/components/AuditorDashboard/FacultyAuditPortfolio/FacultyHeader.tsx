import { Badge } from "../../ui/badge";
import { FacultyMember } from "./types";

interface FacultyHeaderProps {
  faculty: FacultyMember;
}

export function FacultyHeader({ faculty }: FacultyHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
          {faculty.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{faculty.name}</h2>
          <p className="text-gray-600">{faculty.department}</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline">{faculty.totalFiles} Course Files</Badge>
            <Badge variant="outline">{faculty.totalReports} Event Reports</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
