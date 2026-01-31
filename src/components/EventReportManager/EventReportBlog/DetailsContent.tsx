import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { EventReport } from "./types";

interface MetaInfoProps {
  report: EventReport;
}

export function MetaInfo({ report }: MetaInfoProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div className="flex items-center gap-2 text-gray-600">
        <Calendar className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-xs text-gray-500">Date</p>
          <p className="text-sm">{report.eventDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <MapPin className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-xs text-gray-500">Location</p>
          <p className="text-sm">{report.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <Users className="h-5 w-5 text-purple-600" />
        <div>
          <p className="text-xs text-gray-500">Participants</p>
          <p className="text-sm">{report.participants}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="h-5 w-5 text-orange-600" />
        <div>
          <p className="text-xs text-gray-500">Duration</p>
          <p className="text-sm">{report.duration}</p>
        </div>
      </div>
    </div>
  );
}

interface DetailsContentProps {
  report: EventReport;
}

export function DetailsContent({ report }: DetailsContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Objectives */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl mb-3 flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">🎯</span>
              </div>
              Objectives
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {report.objectives}
            </p>
          </CardContent>
        </Card>

        {/* Outcomes & Impact */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl mb-3 flex items-center gap-2">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✨</span>
              </div>
              Outcomes & Impact
            </h2>
            <p className="text-gray-700 leading-relaxed">{report.outcomes}</p>
          </CardContent>
        </Card>

        {/* Event Gallery */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600">📷</span>
              </div>
              Event Gallery
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {report.gallery.map((image, index) => (
                <div
                  key={index}
                  className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
                >
                  <div className="text-center">
                    <span className="text-2xl">📸</span>
                    <p className="text-xs text-gray-500 mt-1">Image {index + 1}</p>
                    <p className="text-xs text-gray-400">{image}</p>
                  </div>
                </div>
              ))}
            </div>
            {report.gallery.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">📸</span>
                <p>No gallery images available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Event Info Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm text-gray-500 mb-4">Event Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Event Type</p>
                <Badge variant="outline">{report.eventType}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Organized By</p>
                <p className="text-sm">{report.facultyName}</p>
                <p className="text-xs text-gray-500">{report.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
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

        {/* Quick Stats */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm text-gray-500 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Participants</span>
                <span className="text-sm">{report.participants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="text-sm">{report.duration}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gallery Images</span>
                <span className="text-sm">{report.gallery.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
