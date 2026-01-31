import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Alert, AlertDescription } from "../../ui/alert";
import { Download } from "lucide-react";
import { CourseFile } from "./types";

interface FileViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: CourseFile | null;
  getStatusColor: (status: string) => string;
}

export function FileViewDialog({
  open,
  onOpenChange,
  file,
  getStatusColor,
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
