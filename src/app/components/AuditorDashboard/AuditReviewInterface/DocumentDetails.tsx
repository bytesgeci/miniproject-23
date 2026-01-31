import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { CourseFile, EventReport } from "./types";

interface DocumentDetailsProps {
  type: "file" | "report";
  item: CourseFile | EventReport;
}

export function DocumentDetails({ type, item }: DocumentDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Details</CardTitle>
      </CardHeader>
      <CardContent>
        {type === "file" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">File Type</p>
              <p>{(item as CourseFile).fileType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Upload Date</p>
              <p>{(item as CourseFile).uploadDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Course Name</p>
              <p>{(item as CourseFile).courseName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Semester</p>
              <p>{(item as CourseFile).semester}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Event Type</p>
                <p>{(item as EventReport).eventType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Event Date</p>
                <p>{(item as EventReport).eventDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p>{(item as EventReport).location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p>{(item as EventReport).participants}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm">{(item as EventReport).description}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Objectives</p>
              <p className="text-sm">{(item as EventReport).objectives}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Outcomes & Impact</p>
              <p className="text-sm">{(item as EventReport).outcomes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
