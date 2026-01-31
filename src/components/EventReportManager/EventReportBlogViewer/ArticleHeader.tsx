import { Badge } from "../../ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { EventReport } from "./types";

interface ArticleHeaderProps {
  report: EventReport;
}

export function ArticleHeader({ report }: ArticleHeaderProps) {
  return (
    <header className="space-y-4">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
        {report.eventName}
      </h1>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-6 text-gray-600 border-b pb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span>
            {new Date(report.eventDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {report.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <span>{report.location}</span>
          </div>
        )}

        {report.participants && (
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <span>{report.participants} Participants</span>
          </div>
        )}

        {report.duration && (
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span>{report.duration}</span>
          </div>
        )}
      </div>

      {/* Community Badge */}
      <div>
        <Badge
          variant="outline"
          className="text-base px-4 py-2 bg-blue-50 text-blue-700 border-blue-200"
        >
          {report.community}
        </Badge>
      </div>
    </header>
  );
}
