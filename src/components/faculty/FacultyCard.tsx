import { memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Building, GraduationCap } from "lucide-react";
import { FacultyMember } from "@/types/faculty";

interface FacultyCardProps {
  faculty: FacultyMember;
  onSelect: (faculty: FacultyMember) => void;
}

function formatRoleLabel(role: string) {
  const normalized = role.trim().toLowerCase();

  switch (normalized) {
    case "faculty":
      return "Faculty";
    case "staff-advisor":
    case "staff advisor":
      return "Staff Advisor";
    case "auditor":
      return "Auditor";
    default:
      return role
        .split(/[-\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export const FacultyCard = memo(function FacultyCard({
  faculty,
  onSelect,
}: FacultyCardProps) {
  const roleCandidates = useMemo(
    () =>
      [
        ...(faculty.roles ?? []),
        faculty.role,
        faculty.isStaffAdvisor ? "staff-advisor" : null,
      ].filter(
        (role): role is string =>
          typeof role === "string" && role.trim().toLowerCase() !== "admin",
      ),
    [faculty.isStaffAdvisor, faculty.role, faculty.roles],
  );

  const rolesToDisplay = useMemo(
    () =>
      Array.from(
        new Map(
          roleCandidates.map((role) => {
            const label = formatRoleLabel(role);
            return [label.toLowerCase(), label] as const;
          }),
        ).values(),
      ),
    [roleCandidates],
  );

  const initials = useMemo(
    () =>
      faculty.name
        .split(" ")
        .map((n) => n[0])
        .join(""),
    [faculty.name],
  );

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
      onClick={() => onSelect(faculty)}
    >
      <CardContent className="pt-6 flex flex-col h-full">
        <div className="flex items-start gap-3 mb-4">
          {faculty.profileImageUrl ? (
            <img
              src={faculty.profileImageUrl}
              alt={`${faculty.name} profile`}
              className="h-12 w-12 rounded-full border object-cover shrink-0"
            />
          ) : (
            <div className="h-12 w-12 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{faculty.name}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {rolesToDisplay.map((roleLabel) => (
                <Badge key={roleLabel} variant="outline" className="text-xs">
                  {roleLabel}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Building className="h-3 w-3 shrink-0" />
            <span className="truncate">{faculty.department}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <GraduationCap className="h-3 w-3 shrink-0" />
            <span className="truncate">{faculty.specialization}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t flex-1 flex flex-col">
          <p className="text-xs text-gray-500 mb-2">
            Courses: {faculty.courses.length}
          </p>
          <div className="flex flex-wrap gap-1 mb-4">
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
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-auto flex items-center justify-center gap-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(faculty);
            }}
          >
            View Portfolio
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
