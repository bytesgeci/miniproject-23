import { EventReport } from "./types";

interface HeroImageProps {
  report: EventReport;
}

export function HeroImage({ report }: HeroImageProps) {
  if (!report.thumbnailUrl) return null;

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl mb-8">
      <img
        src={report.thumbnailUrl}
        alt={report.eventName}
        className="w-full h-96 object-cover"
      />
    </div>
  );
}
