import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Student } from "./types";
import { Mail, Phone, Briefcase, Target, Award } from "lucide-react";

interface StudentDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onAddActivity: () => void;
}

export function StudentDetailDialog({ isOpen, onOpenChange, student, onAddActivity }: StudentDetailDialogProps) {
  if (!student) return null;

  const getPlacementColor = (status: string) => {
    switch (status) {
      case "Placed": return "bg-green-100 text-green-800";
      case "In Process": return "bg-blue-100 text-blue-800";
      case "Not Started": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
          <DialogDescription>
            Complete information and progress tracking
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Student Header */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{student.name}</h3>
              <p className="text-gray-600">{student.rollNumber} • {student.department}</p>
              <Badge className={getPlacementColor(student.placementStatus) + " mt-2"}>
                {student.placementStatus}
              </Badge>
              {student.companyName && (
                <p className="text-sm text-green-600 mt-2">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Placed at {student.companyName}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-medium mb-3">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${student.email}`} className="text-blue-600 hover:underline">
                  {student.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{student.phone}</span>
              </div>
            </div>
          </div>

          {/* Academic Performance */}
          <div>
            <h4 className="font-medium mb-3">Academic Performance</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">CGPA</p>
                <div className="text-2xl font-bold text-blue-600 mt-1">{student.cgpa}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Attendance</p>
                <div className="text-2xl font-bold text-green-600 mt-1">{student.attendance}%</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Semester</p>
                <div className="text-2xl font-bold text-purple-600 mt-1">{student.semester}</div>
              </div>
            </div>
          </div>

          {/* Career Information */}
          <div>
            <h4 className="font-medium mb-3">Career Development</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Career Interest</p>
                <Badge variant="outline" className="mt-1">
                  <Target className="h-3 w-3 mr-1" />
                  {student.careerInterest}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Skills Acquired</p>
                <div className="flex flex-wrap gap-2">
                  {student.skillsAcquired.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="bg-blue-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Points */}
          <div>
            <h4 className="font-medium mb-3">Activity Points</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <Badge variant="outline" className="mt-1">
                  <Award className="h-3 w-3 mr-1" />
                  {student.activityPoints}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Activities</p>
                <div className="flex flex-wrap gap-2">
                  {student.activities.map((activity, idx) => (
                    <Badge key={idx} variant="outline" className="bg-blue-50">
                      {activity.name} ({activity.points} points)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Add Activity Button */}
          <DialogFooter>
            <Button size="sm" onClick={onAddActivity}>
              Add Activity
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
