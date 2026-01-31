import { Alert, AlertDescription } from "../../ui/alert";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { MessageSquare, Reply } from "lucide-react";
import { EventReport } from "./types";

interface AdminReviewSectionProps {
  report: EventReport;
  getStatusColor: (status: string) => string;
  onRespondClick: () => void;
  showRespond: boolean;
}

export function AdminReviewSection({
  report,
  getStatusColor,
  onRespondClick,
  showRespond,
}: AdminReviewSectionProps) {
  if (!report.adminRemarks) return null;

  return (
    <section className="border-t pt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-gray-600" />
          Admin Review
        </h2>
        {report.status && (
          <Badge className={getStatusColor(report.status)}>
            {report.status}
          </Badge>
        )}
      </div>

      <Alert
        className={
          report.status === "Approved"
            ? "border-green-200 bg-green-50"
            : report.status === "Rejected"
              ? "border-red-200 bg-red-50"
              : "border-blue-200 bg-blue-50"
        }
      >
        <AlertDescription>
          <p className="text-sm mb-3">{report.adminRemarks}</p>
          {report.reviewedBy && (
            <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
              <p>Reviewed by: {report.reviewedBy}</p>
              {report.reviewedDate && <p>Date: {report.reviewedDate}</p>}
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Faculty Response */}
      {report.facultyResponse ? (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription>
            <p className="text-xs text-blue-800 mb-2">Your Response:</p>
            <p className="text-sm mb-3">{report.facultyResponse}</p>
            {report.responseDate && (
              <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                <p>Response Date: {report.responseDate}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        showRespond && (
          <Button
            variant="outline"
            onClick={onRespondClick}
            className="w-full"
          >
            <Reply className="h-4 w-4 mr-2" />
            Respond to Admin Review
          </Button>
        )
      )}
    </section>
  );
}
