import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import { FacultyMember } from "./types";
import { FacultyCard } from "./FacultyCard";

interface FacultySubmissionStatusProps {
  facultyMembers: FacultyMember[];
  onSelectFaculty: (faculty: FacultyMember) => void;
}

export function FacultySubmissionStatus({ facultyMembers, onSelectFaculty }: FacultySubmissionStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Faculty Submission Status
        </CardTitle>
        <CardDescription>Review and audit faculty course files and event reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {facultyMembers.map((faculty) => (
            <FacultyCard 
              key={faculty.id} 
              faculty={faculty} 
              onClick={onSelectFaculty}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
