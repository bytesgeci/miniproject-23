"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock3, MapPin, Users, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface UserEventReportRecord {
  id: string;
  eventName: string;
  eventDate: string;
  community: string;
  eventType?: string;
  facultyCoordinator?: string;
  facultyId?: string;
  status?: string;
  location?: string;
  participants?: number;
  duration?: string;
  description?: string;
  objectives?: string;
  outcomes?: string;
  thumbnailUrl?: string;
  galleryImages?: string[];
}

interface UserEventReportsSectionProps {
  reports: UserEventReportRecord[];
  facultyNameById: Record<string, string>;
}

function getStatusColor(status?: string) {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Submitted":
      return "bg-blue-100 text-blue-800";
    case "Draft":
      return "bg-gray-100 text-gray-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

export function UserEventReportsSection({
  reports,
  facultyNameById,
}: UserEventReportsSectionProps) {
  const [selectedReport, setSelectedReport] =
    useState<UserEventReportRecord | null>(null);

  return (
    <>
      {reports.length === 0 ? (
        <Alert>
          <AlertDescription className="text-sm text-gray-500">
            No auditor-approved event reports available yet.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-1">
                            {report.eventName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {report.location || report.community || "N/A"}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status || "Pending"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {report.eventType || "General"}
                        </Badge>
                        <span className="text-gray-500">
                          {typeof report.participants === "number"
                            ? `${report.participants} participants`
                            : "Participants: N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {report.eventDate || "N/A"}
                      {report.duration ? ` • ${report.duration}` : ""}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-sm text-gray-500">Total Reports</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {reports.filter((r) => r.status === "Approved").length}
                </div>
                <p className="text-sm text-gray-500">Approved Reports</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {reports.reduce((sum, r) => sum + (r.participants ?? 0), 0)}
                </div>
                <p className="text-sm text-gray-500">Total Participants</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(selectedReport)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReport(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-5xl">
          {selectedReport ? (
            <div className="max-h-[90vh] overflow-y-auto">
              <div className="border-b border-slate-200 bg-linear-to-r from-slate-100 to-slate-50 px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold text-slate-900">
                    {selectedReport.eventName}
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    {selectedReport.eventDate || "N/A"} •{" "}
                    {selectedReport.community || "N/A"}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status || "Pending"}
                  </Badge>
                  <Badge variant="outline">
                    {selectedReport.eventType || "General"}
                  </Badge>
                  {selectedReport.duration ? (
                    <Badge variant="secondary" className="gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {selectedReport.duration}
                    </Badge>
                  ) : null}
                  {typeof selectedReport.participants === "number" ? (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {selectedReport.participants} Participants
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5 p-6">
                {selectedReport.thumbnailUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <img
                      src={selectedReport.thumbnailUrl}
                      alt={selectedReport.eventName}
                      className="h-80 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Faculty Coordinator
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-800">
                      <UserRound className="h-4 w-4 text-slate-500" />
                      {selectedReport.facultyCoordinator ||
                        facultyNameById[String(selectedReport.facultyId)] ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-800">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      {selectedReport.location || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Description
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                      {selectedReport.description || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Objectives
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                      {selectedReport.objectives || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Outcomes
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                      {selectedReport.outcomes || "N/A"}
                    </p>
                  </div>
                </div>

                {selectedReport.galleryImages?.length ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-900">
                      Gallery
                    </p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {selectedReport.galleryImages.map((image, index) => (
                        <img
                          key={`${selectedReport.id}-gallery-${index}`}
                          src={image}
                          alt={`${selectedReport.eventName} ${index + 1}`}
                          className="h-32 w-full rounded-md border border-slate-200 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
