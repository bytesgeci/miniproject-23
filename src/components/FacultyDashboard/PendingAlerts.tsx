import { PendingActionsAlert } from "../faculty/PendingActionsAlert";

interface PendingAlertsProps {
  pendingReports: number;
}

export function PendingAlerts({ pendingReports }: PendingAlertsProps) {
  return <PendingActionsAlert pendingReports={pendingReports} />;
}
