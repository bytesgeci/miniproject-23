import { memo, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";
import { FacultyMember } from "./types";
import { FacultyCard } from "./FacultyCard";

interface FacultySubmissionStatusProps {
  facultyMembers: FacultyMember[];
  onSelectFaculty: (faculty: FacultyMember) => void;
}

const INITIAL_VISIBLE_COUNT = 10;
const LOAD_MORE_STEP = 15;

export const FacultySubmissionStatus = memo(function FacultySubmissionStatus({
  facultyMembers,
  onSelectFaculty,
}: FacultySubmissionStatusProps) {
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
          <ClipboardCheck className="h-5 w-5" />
          Faculty Submission Status
        </CardTitle>
        <CardDescription>
          Review and audit faculty course files and event reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visibleFaculty.length > 0 ? (
          <div className="space-y-3">
            {visibleFaculty.map((faculty) => (
              <FacultyCard
                key={faculty.id}
                faculty={faculty}
                onClick={onSelectFaculty}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No course files or event reports are currently waiting for auditing.
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
