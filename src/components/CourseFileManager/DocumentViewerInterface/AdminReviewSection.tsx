import { Alert, AlertDescription } from "../../ui/alert";
import { Badge } from "../../ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { CourseFile } from "./types";

interface AdminReviewSectionProps {
  file: CourseFile;
}

export function AdminReviewSection({ file }: AdminReviewSectionProps) {
  if (!file.adminRemarks) return null;

  return (
    <Alert className={file.status === "Approved" ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
      <div className="flex gap-3">
        {file.status === "Approved" ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">Admin Review</h4>
            <Badge variant={file.status === "Approved" ? "default" : "secondary"}>
              {file.status}
            </Badge>
          </div>
          <AlertDescription className="text-gray-700 text-sm">
            {file.adminRemarks}
          </AlertDescription>
          {file.reviewedBy && file.reviewedDate && (
            <p className="text-xs text-gray-600 mt-2">
              Reviewed by {file.reviewedBy} on {file.reviewedDate}
            </p>
          )}
        </div>
      </div>
    </Alert>
  );
}
