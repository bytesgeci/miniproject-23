import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Calendar, Shield } from "lucide-react";
import { EventReport } from "./types";

interface EventReportCardProps {
  report: EventReport;
  onReview: (report: EventReport) => void;
  getStatusColor: (status: string) => string;
}

export function EventReportCard({
  report,
  onReview,
  getStatusColor,
}: EventReportCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
              <span className="text-gray-500">{report.participants} participants</span>
            </div>
          </div>

          {report.auditorRemarks && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800 mb-1">
                Auditor Remarks:
              </p>
              <p className="text-sm text-green-700">{report.auditorRemarks}</p>
            </div>
          )}

          <Button
            variant={report.status === "Submitted" ? "default" : "outline"}
            size="sm"
            onClick={() => onReview(report)}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            {report.status === "Submitted" ? "Review & Audit" : "View Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
