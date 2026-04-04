import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Alert, AlertDescription } from "../../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Download, MessageCircle } from "lucide-react";
import { CourseFile } from "./types";
import { EntityMessagesPanel } from "@/components/shared/messages/EntityMessagesPanel";

interface FileViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: CourseFile | null;
  getStatusColor: (status: string) => string;
  facultyId?: string;
}

export function FileViewDialog({
  open,
  onOpenChange,
  file,
  getStatusColor,
  facultyId,
}: FileViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{file?.fileName}</DialogTitle>
          <DialogDescription>
            <Badge className={getStatusColor(file?.status || "")}>
              {file?.status}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        {file && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Course Code</p>
                <p className="font-medium">{file.courseCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Batch / Academic Year</p>
                <p className="font-medium">{file.academicYear || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">File Type</p>
                <p className="font-medium">{file.fileType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Upload Date</p>
                <p className="font-medium">{file.uploadDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Course Name</p>
                <p className="font-medium">{file.courseName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Semester</p>
                <p className="font-medium">{file.semester}</p>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                This is a read-only view of the course file. You can review the
                details but cannot make changes.
              </AlertDescription>
            </Alert>

            {/* Auditor Remarks */}
            {file.auditorRemarks && (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Auditor Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-900">
                    {file.auditorRemarks}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Messages & Discussion */}
            {file && facultyId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Discussion with Auditor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EntityMessagesPanel
                    facultyId={facultyId}
                    entityType="course-file"
                    entityId={file.id}
                    itemType="file"
                  />
                </CardContent>
              </Card>
            )}

            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
