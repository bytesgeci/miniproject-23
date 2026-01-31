import { useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { StatsOverview } from "./StatsOverview";
import { FacultyStatusOverview } from "./FacultyStatusOverview";
import { CareerExplorationStats } from "./CareerExplorationStats";
import { StudentList } from "./StudentList";
import { StudentDetailDialog } from "./StudentDetailDialog";
import { AddActivityDialog } from "./AddActivityDialog";
import { Student } from "./types";
import { mockStats, mockCareerStats, mockStudents } from "./mockData";
import { toast } from "sonner";

export function StaffAdvisorDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentViewOpen, setIsStudentViewOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [activityPoints, setActivityPoints] = useState("");

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentViewOpen(true);
  };

  const handleAddActivity = () => {
    if (!selectedStudent) return;
    if (!selectedActivity || !selectedCommunity || !activityPoints) {
      toast.error("Please fill in all fields");
      return;
    }
    const newActivity = {
      id: (selectedStudent.activities.length + 1).toString(),
      name: selectedActivity,
      community: selectedCommunity,
      points: parseInt(activityPoints, 10),
      date: new Date().toISOString().split('T')[0]
    };
    const updatedStudent = {
      ...selectedStudent,
      activities: [...selectedStudent.activities, newActivity],
      activityPoints: selectedStudent.activityPoints + parseInt(activityPoints, 10)
    };
    setSelectedStudent(updatedStudent);
    setIsActivityDialogOpen(false);
    setSelectedActivity("");
    setSelectedCommunity("");
    setActivityPoints("");
    toast.success("Activity added successfully");
  };

  return (
    <div className="space-y-6">
      <DashboardHeader stats={mockStats} />
      <StatsOverview stats={mockStats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FacultyStatusOverview stats={mockStats} />
        <CareerExplorationStats careerStats={mockCareerStats} />
      </div>

      <StudentList 
        students={mockStudents} 
        stats={mockStats} 
        onSelectStudent={handleViewStudent}
      />

      <StudentDetailDialog
        isOpen={isStudentViewOpen}
        onOpenChange={setIsStudentViewOpen}
        student={selectedStudent}
        onAddActivity={() => setIsActivityDialogOpen(true)}
      />

      <AddActivityDialog
        isOpen={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
        student={selectedStudent}
        activityName={selectedActivity}
        onActivityNameChange={setSelectedActivity}
        community={selectedCommunity}
        onCommunityChange={setSelectedCommunity}
        activityPoints={activityPoints}
        onActivityPointsChange={setActivityPoints}
        onAddActivity={handleAddActivity}
      />
    </div>
  );
}
