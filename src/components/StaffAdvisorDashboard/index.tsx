"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { DashboardHeader } from "./DashboardHeader";
import { StudentList } from "./StudentList";
import { BatchCourseProgress } from "./BatchCourseProgress";
import {
  BatchCourseOverview,
  CareerStats,
  DashboardStats,
  Student,
} from "./types";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const StudentDetailDialog = dynamic(
  () => import("./StudentDetailDialog").then((mod) => mod.StudentDetailDialog),
  { ssr: false },
);

const AddActivityDialog = dynamic(
  () => import("./AddActivityDialog").then((mod) => mod.AddActivityDialog),
  { ssr: false },
);

interface StaffAdvisorDashboardProps {
  stats: DashboardStats;
  careerStats: CareerStats;
  students: Student[];
  batchCourseOverview: BatchCourseOverview;
}

export function StaffAdvisorDashboard({
  stats,
  students,
  batchCourseOverview,
}: StaffAdvisorDashboardProps) {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentList, setStudentList] = useState<Student[]>(students);
  const [isStudentViewOpen, setIsStudentViewOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [selectedActivitySemester, setSelectedActivitySemester] = useState("");
  const [activityPoints, setActivityPoints] = useState("");
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null,
  );
  const studentApiQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (user?.username) {
      params.set("username", user.username);
    }
    if (user?.id) {
      params.set("advisorId", user.id);
    }
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [user?.id, user?.username]);

  const notifyDashboardDataUpdated = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dashboard:data-updated"));
    }
  }, []);
  const derivedStats = useMemo<DashboardStats>(() => {
    const totalStudents = studentList.length;
    const placedStudents = studentList.filter(
      (student) => student.placementStatus === "Placed",
    ).length;
    const inProcess = studentList.filter(
      (student) => student.placementStatus === "In Process",
    ).length;
    const averageCGPA = totalStudents
      ? Number(
          (
            studentList.reduce((sum, student) => sum + student.cgpa, 0) /
            totalStudents
          ).toFixed(1),
        )
      : 0;
    const averageAttendance = totalStudents
      ? Math.round(
          studentList.reduce((sum, student) => sum + student.attendance, 0) /
            totalStudents,
        )
      : 0;
    const batchYear =
      studentList.find((student) => student.batchYear)?.batchYear ??
      stats.batchYear;

    return {
      ...stats,
      totalStudents,
      placedStudents,
      inProcess,
      averageCGPA,
      averageAttendance,
      batchYear,
    };
  }, [studentList, stats]);

  // Ensure all batches in student list appear in course progress
  const derivedBatchCourseOverview = useMemo<BatchCourseOverview>(() => {
    const currentBatchYears = Array.from(
      new Set(studentList.map((s) => s.batchYear).filter(Boolean)),
    ) as string[];

    // Keep existing groups and add missing batches with 0 files
    const existingBatchYears = new Set(
      batchCourseOverview.groups.map((g) => g.progress.batchYear),
    );

    const missingBatches = currentBatchYears
      .filter((year) => !existingBatchYears.has(year))
      .map((year) => ({
        progress: {
          batchYear: year,
          totalFiles: 0,
          approvedFiles: 0,
          inReviewFiles: 0,
          rejectedFiles: 0,
          completionRate: 0,
        },
        faculty: [],
      }));

    const allGroups = [...batchCourseOverview.groups, ...missingBatches].sort(
      (a, b) =>
        (b.progress.batchYear || "").localeCompare(a.progress.batchYear || ""),
    );

    return {
      overall: batchCourseOverview.overall,
      groups: allGroups,
    };
  }, [studentList, batchCourseOverview]);

  const handleViewStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setIsStudentViewOpen(true);
  }, []);

  const handleUpdateStudent = useCallback(
    async (updatedStudent: Student) => {
      try {
        const response = await fetch(
          `/api/students/${updatedStudent.id}${studentApiQuery}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedStudent),
          },
        );

        if (response.ok) {
          setStudentList((prev) =>
            prev.map((student) =>
              student.id === updatedStudent.id ? updatedStudent : student,
            ),
          );
          setSelectedStudent(updatedStudent);
          notifyDashboardDataUpdated();
          toast.success("Student updated successfully");
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update student");
        }
      } catch (error) {
        console.error("Error updating student:", error);
        toast.error("Failed to update student");
      }
    },
    [notifyDashboardDataUpdated, studentApiQuery],
  );

  const handleAddActivity = useCallback(async () => {
    if (!selectedStudent) return;
    if (
      !selectedActivity ||
      !selectedCommunity ||
      !activityPoints ||
      !selectedActivitySemester
    ) {
      toast.error("Please fill in all fields, including semester");
      return;
    }
    const newActivity = {
      id: `act-${Date.now()}`,
      name: selectedActivity,
      community: selectedCommunity,
      points: parseInt(activityPoints, 10),
      date: new Date().toISOString().split("T")[0],
    };
    const updatedStudent = {
      ...selectedStudent,
      semester: selectedActivitySemester,
      activities: [...selectedStudent.activities, newActivity],
      activityPoints: selectedStudent.activityPoints + newActivity.points,
    };

    try {
      const response = await fetch(
        `/api/students/${updatedStudent.id}${studentApiQuery}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedStudent),
        },
      );

      if (response.ok) {
        setStudentList((prev) =>
          prev.map((student) =>
            student.id === updatedStudent.id ? updatedStudent : student,
          ),
        );
        setSelectedStudent(updatedStudent);
        setIsActivityDialogOpen(false);
        setSelectedActivity("");
        setSelectedCommunity("");
        setSelectedActivitySemester("");
        setActivityPoints("");
        notifyDashboardDataUpdated();
        toast.success("Activity added successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add activity");
      }
    } catch (error) {
      console.error("Error adding activity:", error);
      toast.error("Failed to add activity");
    }
  }, [
    activityPoints,
    notifyDashboardDataUpdated,
    selectedActivity,
    selectedActivitySemester,
    selectedCommunity,
    selectedStudent,
    studentApiQuery,
  ]);

  const handleAddStudent = useCallback(
    async (student: Student): Promise<boolean> => {
      try {
        const response = await fetch(`/api/students${studentApiQuery}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: student.name,
            rollNumber: student.rollNumber,
            email: student.email,
            phone: student.phone,
            department: student.department,
            semester: student.semester,
            batchYear: student.batchYear,
            cgpa: student.cgpa,
            attendance: student.attendance,
            careerInterest: student.careerInterest,
            skillsAcquired: student.skillsAcquired,
            placementStatus: student.placementStatus,
            companyName: student.companyName,
            activityPoints: student.activityPoints,
            activities: student.activities,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const savedStudent = data.student || student;
          setStudentList((prev) => [savedStudent, ...prev]);
          notifyDashboardDataUpdated();
          toast.success("Student added successfully");
          return true;
        }

        const error = await response.json();
        toast.error(error.error || "Failed to add student");
        return false;
      } catch (error) {
        console.error("Error adding student:", error);
        toast.error("Failed to add student");
        return false;
      }
    },
    [notifyDashboardDataUpdated, studentApiQuery],
  );

  const handleDeleteStudent = useCallback(
    async (studentId: string) => {
      if (deletingStudentId === studentId) {
        return;
      }

      setDeletingStudentId(studentId);
      try {
        const response = await fetch(
          `/api/students/${studentId}${studentApiQuery}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || "Failed to delete student");
          return;
        }

        setStudentList((prev) =>
          prev.filter((student) => student.id !== studentId),
        );
        setSelectedStudent((prev) => (prev?.id === studentId ? null : prev));
        setIsStudentViewOpen(false);
        notifyDashboardDataUpdated();
        toast.success("Student deleted successfully");
      } catch (error) {
        console.error("Error deleting student:", error);
        toast.error("Failed to delete student");
      } finally {
        setDeletingStudentId(null);
      }
    },
    [deletingStudentId, notifyDashboardDataUpdated, studentApiQuery],
  );

  return (
    <div className="space-y-6">
      <DashboardHeader stats={derivedStats} />

      <BatchCourseProgress groups={derivedBatchCourseOverview.groups} />

      <StudentList
        students={studentList}
        stats={derivedStats}
        onSelectStudent={handleViewStudent}
        onAddStudent={handleAddStudent}
      />

      {selectedStudent && (
        <StudentDetailDialog
          isOpen={isStudentViewOpen}
          onOpenChange={setIsStudentViewOpen}
          student={selectedStudent}
          onAddActivity={() => setIsActivityDialogOpen(true)}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      )}

      {selectedStudent && isActivityDialogOpen && (
        <AddActivityDialog
          isOpen={isActivityDialogOpen}
          onOpenChange={setIsActivityDialogOpen}
          student={selectedStudent}
          activityName={selectedActivity}
          onActivityNameChange={setSelectedActivity}
          community={selectedCommunity}
          onCommunityChange={setSelectedCommunity}
          semester={selectedActivitySemester}
          onSemesterChange={setSelectedActivitySemester}
          activityPoints={activityPoints}
          onActivityPointsChange={setActivityPoints}
          onAddActivity={handleAddActivity}
        />
      )}
    </div>
  );
}
