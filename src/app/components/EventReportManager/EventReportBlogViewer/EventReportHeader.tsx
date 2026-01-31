import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { EventReport } from "./types";

interface EventReportHeaderProps {
  report: EventReport;
  onBack: () => void;
  onDownload: (report: EventReport) => void;
  getStatusColor: (status: string) => string;
}

export function EventReportHeader({
  report,
  onBack,
  onDownload,
  getStatusColor,
}: EventReportHeaderProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div className="flex items-center gap-3">
            {report.status && (
              <Badge className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            )}
            <Button onClick={() => onDownload(report)}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
