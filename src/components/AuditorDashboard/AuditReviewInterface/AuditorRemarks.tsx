import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { CourseFile, EventReport } from "./types";

interface AuditorRemarksProps {
  type: "file" | "report";
  item: CourseFile | EventReport;
  auditorRemarks: string;
  onRemarksChange: (remarks: string) => void;
  reviewDecision: "approve" | "reject" | null;
  onDecisionChange: (decision: "approve" | "reject") => void;
  onSubmit: () => void;
  checklist: Array<{ id: string; label: string }>;
  checkedItems: Record<string, "yes" | "no" | "pending">;
}

export function AuditorRemarks({
  type,
  auditorRemarks,
  onRemarksChange,
  reviewDecision,
  onDecisionChange,
  onSubmit,
  checklist,
  checkedItems,
}: AuditorRemarksProps) {
  const handleSubmit = () => {
    if (!reviewDecision) {
      toast.error("Please select approve or reject");
      return;
    }

    const allChecked = checklist.every(item => checkedItems[item.id]);
    if (!allChecked) {
      toast.error("Please complete all checklist items");
      return;
    }

    if (!auditorRemarks.trim()) {
      toast.error("Please provide auditor remarks");
      return;
    }

    onSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditor Remarks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Provide detailed feedback and remarks..."
          value={auditorRemarks}
          onChange={(e) => onRemarksChange(e.target.value)}
          rows={6}
        />

        {/* Decision Buttons */}
        <div className="flex gap-4">
          <Button
            variant={reviewDecision === "approve" ? "default" : "outline"}
            onClick={() => onDecisionChange("approve")}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button
            variant={reviewDecision === "reject" ? "destructive" : "outline"}
            onClick={() => onDecisionChange("reject")}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>

        <Button onClick={handleSubmit} className="w-full" size="lg">
          Submit Review
        </Button>
      </CardContent>
    </Card>
  );
}
