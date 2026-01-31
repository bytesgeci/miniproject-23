import { Button } from "../../ui/button";
import { ArrowLeft } from "lucide-react";
import { ThumbnailSection } from "./ThumbnailSection";
import { MetaInfo } from "./DetailsContent";
import { DetailsContent } from "./DetailsContent";
import { EventReportBlogProps } from "./types";

export function EventReportBlog({ report, onBack }: EventReportBlogProps) {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Reports
      </Button>

      {/* Hero/Thumbnail Section */}
      <ThumbnailSection report={report} />

      {/* Meta Information */}
      <MetaInfo report={report} />

      {/* Event Details */}
      <DetailsContent report={report} />
    </div>
  );
}
