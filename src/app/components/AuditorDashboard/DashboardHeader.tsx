import { Shield } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
        <Shield className="h-6 w-6 text-orange-600" />
      </div>
      <div>
        <h2>Auditor Dashboard</h2>
        <p className="text-gray-600">Quality Assurance & Compliance Review</p>
      </div>
    </div>
  );
}
