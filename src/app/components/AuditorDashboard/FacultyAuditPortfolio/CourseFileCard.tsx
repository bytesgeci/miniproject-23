import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { FileText, Shield } from "lucide-react";
import { CourseFile } from "./types";

interface CourseFileCardProps {
  file: CourseFile;
  onReview: (file: CourseFile) => void;
  getStatusColor: (status: string) => string;
}

export function CourseFileCard({
  file,
  onReview,
  getStatusColor,
}: CourseFileCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.fileName}</p>
                <p className="text-sm text-gray-600">{file.courseName}</p>
              </div>
            </div>
            <Badge className={getStatusColor(file.status)}>
              {file.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <Badge variant="outline">{file.fileType}</Badge>
              <span className="text-gray-500 ml-2">{file.semester}</span>
            </div>
            <span className="text-xs text-gray-500">{file.uploadDate}</span>
          </div>

          {file.auditorRemarks && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800 mb-1">
                Auditor Remarks:
              </p>
              <p className="text-sm text-green-700">{file.auditorRemarks}</p>
            </div>
          )}

          <Button
            variant={file.status === "Submitted" ? "default" : "outline"}
            size="sm"
            onClick={() => onReview(file)}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            {file.status === "Submitted" ? "Review & Audit" : "View Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
