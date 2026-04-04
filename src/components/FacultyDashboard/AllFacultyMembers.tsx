import { memo, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { FacultyCard } from "../faculty/FacultyCard";
import { FacultyMember } from "@/types/faculty";

interface AllFacultyMembersProps {
  facultyMembers: FacultyMember[];
  onSelectFaculty: (faculty: FacultyMember) => void;
}

const INITIAL_VISIBLE_COUNT = 9;
const LOAD_MORE_STEP = 12;

export const AllFacultyMembers = memo(function AllFacultyMembers({
  facultyMembers,
  onSelectFaculty,
}: AllFacultyMembersProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [facultyMembers.length]);

  const visibleFaculty = useMemo(
    () => facultyMembers.slice(0, visibleCount),
    [facultyMembers, visibleCount],
  );

  const canShowMore = visibleCount < facultyMembers.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          All Faculty Members
        </CardTitle>
        <CardDescription>
          View portfolios of all faculty members including their course files
          and event reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visibleFaculty.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleFaculty.map((faculty) => (
              <FacultyCard
                key={faculty.id}
                faculty={faculty}
                onSelect={onSelectFaculty}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No faculty members available right now. Please refresh, then verify
            production environment variables and database connection.
          </p>
        )}
        {canShowMore ? (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() =>
                setVisibleCount((current) =>
                  Math.min(current + LOAD_MORE_STEP, facultyMembers.length),
                )
              }
            >
              Show more ({facultyMembers.length - visibleCount} remaining)
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
});
