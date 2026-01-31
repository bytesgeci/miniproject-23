import { EventReport } from "./types";

interface ArticleContentProps {
  report: EventReport;
}

export function ArticleContent({ report }: ArticleContentProps) {
  return (
    <div className="space-y-8">
      {/* Event Description */}
      <section className="prose prose-lg max-w-none">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Event Overview
        </h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {report.description}
        </p>
      </section>

      {/* Objectives */}
      {report.objectives && (
        <section className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="h-8 w-1 bg-blue-600 rounded"></div>
            Objectives
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {report.objectives}
          </p>
        </section>
      )}

      {/* Outcomes */}
      {report.outcomes && (
        <section className="bg-green-50 rounded-lg p-6 border border-green-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="h-8 w-1 bg-green-600 rounded"></div>
            Outcomes & Impact
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {report.outcomes}
          </p>
        </section>
      )}
    </div>
  );
}
