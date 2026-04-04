import { Dialog, DialogContent, DialogTitle } from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Calendar, Users, MessageCircle } from "lucide-react";
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
      <DialogContent className="w-[75vw] max-w-[75vw] sm:max-w-[75vw] max-h-[90vh] overflow-y-auto p-0 border-0">
        <DialogTitle className="sr-only">
          {report?.eventName || "Event Report"}
        </DialogTitle>
        {report && (
          <div className="bg-white">
            {/* Featured Image */}
            {report.thumbnailUrl ? (
              <img
                src={report.thumbnailUrl}
                alt={report.eventName}
                className="w-full h-80 object-cover"
              />
            ) : (
              <div className="w-full h-80 bg-linear-to-br from-blue-500 to-purple-600 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-pattern"></div>
                <div className="text-white text-center z-10">
                  <Calendar className="h-16 w-16 mx-auto mb-2 opacity-80" />
                  <p className="text-sm opacity-80">Event Report</p>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-8 max-w-3xl mx-auto">
              {/* Title */}
              <h1 className="text-4xl font-bold mb-4 text-gray-900">
                {report.eventName}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(report.eventDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {report.participants} participants
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Badge variant="outline" className="text-xs">
                    {report.eventType || "General"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                    {report.status}
                  </Badge>
                </div>
              </div>

              {/* Author Info */}
              {report.facultyCoordinator && (
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                  <div className="h-12 w-12 bg-linear-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {report.facultyCoordinator
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      By {report.facultyCoordinator}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.community || report.department || "Coordinator"}
                    </p>
                  </div>
                </div>
              )}

              {/* Event Overview */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Event Overview
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {report.description}
                </p>

                {report.location && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium text-gray-900">
                      {report.location}
                    </p>
                  </div>
                )}

                {report.duration && (
                  <div className="inline-block bg-gray-50 rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium text-gray-900">
                      {report.duration}
                    </p>
                  </div>
                )}
              </section>

              {/* Objectives */}
              {report.objectives && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Objectives
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {report.objectives}
                    </p>
                  </div>
                </section>
              )}

              {/* Outcomes & Impact */}
              {report.outcomes && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Outcomes & Impact
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {report.outcomes}
                  </p>
                </section>
              )}

              {/* Event Photos */}
              {galleryImageUrls.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Event Photos
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryImageUrls.map((imageUrl, index) => (
                      <img
                        key={`${report.id}-gallery-${index}`}
                        src={imageUrl}
                        alt={`${report.eventName} photo ${index + 1}`}
                        className="w-full h-36 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Auditor Remarks & Discussion Section */}
            <div className="p-8 max-w-3xl mx-auto border-t border-gray-200">
              {/* Auditor Remarks */}
              {report.auditorRemarks && (
                <Card className="mb-6 bg-amber-50 border-amber-200">
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
