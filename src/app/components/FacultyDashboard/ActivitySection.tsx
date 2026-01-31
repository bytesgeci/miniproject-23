import { RecentActivity } from "../faculty/RecentActivity";
import { FacultyDirectory } from "../faculty/FacultyDirectory";
import { FacultyMember } from "../../types/faculty";
import { Activity } from "./types";

interface ActivitySectionProps {
  activities: Activity[];
  facultyMembers: FacultyMember[];
  onSelectFaculty: (faculty: FacultyMember) => void;
}

export function ActivitySection({ activities, facultyMembers, onSelectFaculty }: ActivitySectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RecentActivity activities={activities} />
      <FacultyDirectory
        facultyMembers={facultyMembers}
        onSelectFaculty={onSelectFaculty}
      />
    </div>
  );
}
