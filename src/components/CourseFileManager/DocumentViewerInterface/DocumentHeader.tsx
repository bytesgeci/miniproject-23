import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { CourseFile } from "./types";

interface DocumentHeaderProps {
  file: CourseFile;
  onBack: () => void;
  onDownload: (file: CourseFile) => void;
}

export function DocumentHeader({ file, onBack, onDownload }: DocumentHeaderProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Files
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{file.fileName}</h1>
              <p className="text-sm text-gray-600">
                {file.courseCode} - {file.courseName}
              </p>
            </div>
          </div>
          <Button onClick={() => onDownload(file)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
