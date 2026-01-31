import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Student } from "./types";
import { Briefcase } from "lucide-react";

interface AddActivityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  activityName: string;
  onActivityNameChange: (value: string) => void;
  community: string;
  onCommunityChange: (value: string) => void;
  activityPoints: string;
  onActivityPointsChange: (value: string) => void;
  onAddActivity: () => void;
}

export function AddActivityDialog({
  isOpen,
  onOpenChange,
  student,
  activityName,
  onActivityNameChange,
  community,
  onCommunityChange,
  activityPoints,
  onActivityPointsChange,
  onAddActivity
}: AddActivityDialogProps) {
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
          <DialogTitle>Add Activity</DialogTitle>
          <DialogDescription>
            Add a new activity for the student
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

          {/* Add Activity Form */}
          <div>
            <h4 className="font-medium mb-3">Add Activity</h4>
            <div className="space-y-4">
              <div>
                <Label>Activity Name</Label>
                <Input
                  placeholder="Enter activity name"
                  value={activityName}
                  onChange={(e) => onActivityNameChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Community</Label>
                <Input
                  placeholder="Enter community name"
                  value={community}
                  onChange={(e) => onCommunityChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Points</Label>
                <Input
                  placeholder="Enter points"
                  value={activityPoints}
                  onChange={(e) => onActivityPointsChange(e.target.value)}
                  type="number"
                />
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
