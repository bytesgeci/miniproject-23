import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Alert, AlertDescription } from "../../ui/alert";
import { EventReport } from "./types";

interface ReportViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: EventReport | null;
  getStatusColor: (status: string) => string;
}

export function ReportViewDialog({
  open,
  onOpenChange,
  report,
  getStatusColor,
}: ReportViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report?.eventName}</DialogTitle>
          <DialogDescription>
            <Badge className={getStatusColor(report?.status || "")}>
              {report?.status}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Event Type</p>
                <p className="font-medium">{report.eventType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Event Date</p>
                <p className="font-medium">{report.eventDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{report.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="font-medium">{report.participants}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{report.duration}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{report.description}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Objectives</p>
              <p className="text-sm text-gray-700">{report.objectives}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Outcomes & Impact</p>
              <p className="text-sm text-gray-700">{report.outcomes}</p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                This is a read-only view of the event report. You can review the
                details but cannot make changes.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
