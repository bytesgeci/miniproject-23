import { useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { ChecklistSidebar } from "./ChecklistSidebar";
import { DocumentViewer } from "./DocumentViewer";
import { DocumentDetails } from "./DocumentDetails";
import { AuditorRemarks } from "./AuditorRemarks";
import { AuditReviewInterfaceProps, ChecklistItem } from "./types";

const courseFileChecklist: ChecklistItem[] = [
  { id: "format", label: "Document format is correct and readable" }
];

const eventReportChecklist: ChecklistItem[] = [
  { id: "details", label: "Event details are complete and accurate" }
];

export function AuditReviewInterface({ type, item, facultyName, onBack }: AuditReviewInterfaceProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, "yes" | "no" | "pending">>({});
  const [auditorRemarks, setAuditorRemarks] = useState("");
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject" | null>(null);

  const checklist = type === "file" ? courseFileChecklist : eventReportChecklist;

  const handleChecklistChange = (itemId: string, value: "yes" | "no" | "pending") => {
    setCheckedItems({
      ...checkedItems,
      [itemId]: value
    });
  };

  const handleSubmitReview = () => {
    toast.success(`${type === "file" ? "Course file" : "Event report"} ${reviewDecision}d successfully`);
    onBack();
  };

  const handleDownloadSheet = () => {
    // Create CSV content
    let csvContent = "Checklist Item,Status\n";
    checklist.forEach(item => {
      const status = checkedItems[item.id] || "pending";
      csvContent += `"${item.label}",${status}\n`;
    });
    csvContent += `\nRemarks,"${auditorRemarks}"\n`;
    csvContent += `Decision,${reviewDecision || "pending"}\n`;

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const itemName = type === "file" 
      ? (item as any).fileName 
      : (item as any).eventName?.replace(/ /g, "_") || "report";
    link.download = `audit-${facultyName.replace(/ /g, "_")}-${itemName}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Audit sheet downloaded successfully");
  };

  const handleDownloadDocument = () => {
    const itemName = type === "file" ? (item as any).fileName : (item as any).eventName;
    toast.success(`Downloading ${itemName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Faculty List
        </Button>
        <Button variant="outline" onClick={handleDownloadSheet}>
          <Download className="h-4 w-4 mr-2" />
          Download Audit Sheet
        </Button>
      </div>

      {/* Faculty Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{facultyName}</h3>
              <p className="text-sm text-gray-600">
                {type === "file" ? "Course File Review" : "Event Report Review"}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge 
                className={reviewDecision === "approve" ? "bg-green-100 text-green-800" : ""}
                variant={reviewDecision === "approve" ? "default" : "outline"}
              >
                {reviewDecision === "approve" ? "Approved" : "Not Approved"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Checklist Sidebar */}
        <ChecklistSidebar
          checklist={checklist}
          checkedItems={checkedItems}
          onChecklistChange={handleChecklistChange}
        />

        {/* Document Viewer & Details - Right Side */}
        <div className="lg:col-span-3 space-y-6">
          {/* Document Viewer */}
          <DocumentViewer type={type} item={item} onDownload={handleDownloadDocument} />

          {/* Document Details */}
          <DocumentDetails type={type} item={item} />

          {/* Auditor Remarks */}
          <AuditorRemarks
            type={type}
            item={item}
            auditorRemarks={auditorRemarks}
            onRemarksChange={setAuditorRemarks}
            reviewDecision={reviewDecision}
            onDecisionChange={setReviewDecision}
            onSubmit={handleSubmitReview}
            checklist={checklist}
            checkedItems={checkedItems}
          />
        </div>
      </div>
    </div>
  );
}
