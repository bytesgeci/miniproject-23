import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Calendar, MessageCircle } from "lucide-react";
import { useState } from "react";
import { EventReport } from "./types";
import { EventMessagesDialog } from "./EventMessagesDialog";

interface EventReportCardProps {
  report: EventReport;
  facultyId?: string;
  onView: (report: EventReport) => void;
  getStatusColor: (status: string) => string;
}

export function EventReportCard({
  report,
  facultyId,
  onView,
  getStatusColor,
}: EventReportCardProps) {
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-1">{report.eventName}</p>
                  <p className="text-sm text-gray-600">{report.location}</p>
                </div>
              </div>
              <Badge className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{report.eventType}</Badge>
                <span className="text-gray-500">
                  {report.participants} participants
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {report.eventDate} • {report.duration}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(report)}
                className="flex-1"
              >
                View Details
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMessageDialogOpen(true)}
                className="h-8 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600"
                title="View messages from auditor"
              >
                <MessageCircle className="h-4 w-4" />
                <Badge variant="secondary" className="ml-1 h-5">
                  !
                </Badge>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <EventMessagesDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        report={report}
        facultyId={facultyId}
      />
    </>
  );
}
