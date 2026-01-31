import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight } from "lucide-react";
import { FacultyMember } from "@/types/faculty";

interface FacultyDirectoryProps {
  facultyMembers: FacultyMember[];
  onSelectFaculty: (faculty: FacultyMember) => void;
}

export function FacultyDirectory({
  facultyMembers,
  onSelectFaculty,
}: FacultyDirectoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Faculty Directory
        </CardTitle>
        <CardDescription>Browse faculty members and their portfolios</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {facultyMembers.slice(0, 5).map((faculty) => (
            <Button
              key={faculty.id}
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3 hover:bg-gray-50"
              onClick={() => onSelectFaculty(faculty)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  {faculty.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{faculty.name}</p>
                  <p className="text-xs text-gray-500 truncate">{faculty.department}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
            </Button>
          ))}
        </div>
        {facultyMembers.length > 5 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-center text-gray-500">
              +{facultyMembers.length - 5} more faculty members
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
