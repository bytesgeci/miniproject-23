import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Image as ImageIcon } from "lucide-react";
import { EventReport } from "./types";

interface ThumbnailSectionProps {
  report: EventReport;
}

export function ThumbnailSection({ report }: ThumbnailSectionProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg flex items-center justify-center">
          <div className="text-center text-white p-8">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm opacity-75">Event Thumbnail</p>
            <p className="text-xs mt-1">{report.thumbnail}</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl mb-2">{report.eventName}</h1>
              <p className="text-gray-600">{report.description}</p>
            </div>
            <Badge
              className={
                report.status === "Approved"
                  ? "bg-green-100 text-green-800"
                  : report.status === "Submitted"
                    ? "bg-blue-100 text-blue-800"
                    : report.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
              }
            >
              {report.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
