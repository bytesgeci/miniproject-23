import { EventReport } from "./types";
import { User as UserIcon } from "lucide-react";

interface CoordinatorSectionProps {
  report: EventReport;
}

export function CoordinatorSection({ report }: CoordinatorSectionProps) {
  return (
    <section className="border-t pt-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
          <UserIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Coordinated by</p>
          <p className="font-medium text-gray-900">{report.facultyCoordinator}</p>
        </div>
      </div>
    </section>
  );
}
