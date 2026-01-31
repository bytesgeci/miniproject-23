import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { FacultyCard } from "../faculty/FacultyCard";
import { FacultyMember } from "@/types/faculty";

interface AllFacultyMembersProps {
  facultyMembers: FacultyMember[];
  onSelectFaculty: (faculty: FacultyMember) => void;
}

export function AllFacultyMembers({ facultyMembers, onSelectFaculty }: AllFacultyMembersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          All Faculty Members
        </CardTitle>
        <CardDescription>View portfolios of all faculty members including their course files and event reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyMembers.map((faculty) => (
            <FacultyCard
              key={faculty.id}
              faculty={faculty}
              onSelect={onSelectFaculty}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
