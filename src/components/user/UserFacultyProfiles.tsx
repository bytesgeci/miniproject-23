"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FacultyCard } from "@/components/faculty/FacultyCard";
import type { FacultyMember } from "@/types/faculty";

interface UserFacultyProfilesProps {
  facultyMembers: FacultyMember[];
}

const INITIAL_VISIBLE = 9;
const LOAD_MORE_STEP = 12;

export const UserFacultyProfiles = memo(function UserFacultyProfiles({
  facultyMembers,
}: UserFacultyProfilesProps) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    const prefetchCandidates = facultyMembers.slice(0, 24);
    prefetchCandidates.forEach((faculty) => {
      router.prefetch(`/faculty/${faculty.id}`);
    });
  }, [facultyMembers, router]);

  const visibleFaculty = useMemo(
    () => facultyMembers.slice(0, visibleCount),
    [facultyMembers, visibleCount],
  );

  const remaining = facultyMembers.length - visibleCount;

  const handleSelectFaculty = (faculty: FacultyMember) => {
    router.push(`/faculty/${faculty.id}`);
  };

  if (facultyMembers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm font-medium text-slate-800">
          No faculty profiles found
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Faculty profiles will appear here once they are available.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleFaculty.map((faculty) => (
          <FacultyCard
            key={faculty.id}
            faculty={faculty}
            onSelect={handleSelectFaculty}
          />
        ))}
      </div>
      {remaining > 0 ? (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() =>
              setVisibleCount((current) =>
                Math.min(current + LOAD_MORE_STEP, facultyMembers.length),
              )
            }
          >
            Show more ({remaining} remaining)
          </Button>
        </div>
      ) : null}
    </>
  );
});
