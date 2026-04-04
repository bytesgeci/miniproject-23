import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Alert, AlertDescription } from "../../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { MessageCircle } from "lucide-react";
import { EventReport } from "./types";
import { EntityMessagesPanel } from "../../shared/messages/EntityMessagesPanel";

interface ReportViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: EventReport | null;
  getStatusColor: (status: string) => string;
  facultyId?: string;
}

export function ReportViewDialog({
  open,
  onOpenChange,
  report,
  getStatusColor,
  facultyId,
}: ReportViewDialogProps) {
  const galleryImageUrls =
    report?.galleryImages?.filter(
      (url, index, self): url is string =>
        Boolean(url) && self.indexOf(url) === index,
    ) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[75vw] max-w-[75vw] sm:max-w-[75vw] max-h-[90vh] overflow-y-auto">
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

            {galleryImageUrls.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Event Photos</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImageUrls.map((imageUrl, index) => (
                    <img
                      key={`${report.id}-gallery-${index}`}
                      src={imageUrl}
                      alt={`${report.eventName} photo ${index + 1}`}
                      className="w-full h-28 rounded-lg object-cover border"
                    />
                  ))}
                </div>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                This is a read-only view of the event report. You can review the
                details but cannot make changes.
              </AlertDescription>
            </Alert>

            {/* Auditor Remarks */}
            {report.auditorRemarks && (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Auditor Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-900">
                    {report.auditorRemarks}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Messages & Discussion */}
            {report && facultyId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Discussion with Auditor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EntityMessagesPanel
                    facultyId={facultyId}
                    entityType="event-report"
                    entityId={report.id}
                    itemType="report"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
