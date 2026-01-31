import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Search, Plus } from "lucide-react";
import { Student, DashboardStats } from "./types";
import { StudentCard } from "./StudentCard";
import { useState } from "react";

interface StudentListProps {
  students: Student[];
  stats: DashboardStats;
  onSelectStudent: (student: Student) => void;
}

export function StudentList({ students, stats, onSelectStudent }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.careerInterest.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student List - Batch {stats.batchYear}</CardTitle>
            <CardDescription>Manage and track student progress and placements</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Add a new student to your batch</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Student Name</Label>
                  <Input placeholder="Enter student name" />
                </div>
                <div>
                  <Label>Roll Number</Label>
                  <Input placeholder="Enter roll number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="student@college.edu" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <Button className="w-full">Add Student</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, roll number, or career interest..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Student Cards */}
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onViewDetails={onSelectStudent}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
