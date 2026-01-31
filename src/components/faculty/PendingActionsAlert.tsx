import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PendingActionsAlertProps {
  pendingReports: number;
}

export function PendingActionsAlert({ pendingReports }: PendingActionsAlertProps) {
  if (pendingReports <= 0) return null;

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Pending Actions</AlertTitle>
      <AlertDescription>
        You have {pendingReports} draft report{pendingReports > 1 ? "s" : ""} waiting to be submitted.
      </AlertDescription>
    </Alert>
  );
}
