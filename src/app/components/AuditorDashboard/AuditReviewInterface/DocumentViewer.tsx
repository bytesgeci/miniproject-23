import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { FileText, Calendar, Download } from "lucide-react";
import { CourseFile, EventReport } from "./types";

interface DocumentViewerProps {
  type: "file" | "report";
  item: CourseFile | EventReport;
  onDownload: () => void;
}

export function DocumentViewer({ type, item, onDownload }: DocumentViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === "file" ? <FileText className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
          Document Viewer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-[16/10] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {type === "file" 
                ? `Document: ${(item as CourseFile).fileName}`
                : `Report: ${(item as EventReport).eventName}`}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Live document preview would appear here
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
