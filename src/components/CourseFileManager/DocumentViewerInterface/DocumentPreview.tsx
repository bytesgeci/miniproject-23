import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { FileText } from "lucide-react";
import { CourseFile } from "./types";

interface DocumentPreviewProps {
  file: CourseFile;
}

export function DocumentPreview({ file }: DocumentPreviewProps) {
  return (
    <Card className="border-0 shadow-sm">
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Document Preview</p>
          <p className="text-sm text-gray-500">File: {file.fileName}</p>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">File Type:</span>
          <span className="text-sm text-gray-900">.pdf</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Upload Date:</span>
          <span className="text-sm text-gray-900">{file.uploadDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Status:</span>
          <Badge
            variant={
              file.status === "Approved"
                ? "default"
                : file.status === "Pending"
                  ? "secondary"
                  : "outline"
            }
          >
            {file.status}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
