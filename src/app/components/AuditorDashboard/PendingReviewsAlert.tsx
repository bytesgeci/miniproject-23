import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { DashboardStats } from "./types";

interface PendingReviewsAlertProps {
  stats: DashboardStats;
}

export function PendingReviewsAlert({ stats }: PendingReviewsAlertProps) {
  const totalPending = stats.pendingFiles + stats.pendingReports;

  if (totalPending === 0) return null;

  return (
    <Alert className="bg-orange-50 border-orange-200">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        You have {totalPending} pending items awaiting review and approval.
      </AlertDescription>
    </Alert>
  );
}
