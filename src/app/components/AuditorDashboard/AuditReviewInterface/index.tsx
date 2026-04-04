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
import { useAuth } from "@/context/AuthContext";
import { sendMessage } from "@/lib/messageClient";

const theoryCourseFileChecklist: ChecklistItem[] = [
  { id: "co_po_mapping", label: "CO–PO Mapping (CO–PO Mapping Level)" },
  { id: "co_pso_mapping", label: "CO–PO Mapping (CO–PSO Mapping Level)" },
  { id: "justification", label: "Justification of Mapping" },
  { id: "course_coverage", label: "Course File Coverage" },
  { id: "test_qp", label: "Test (QP)" },
  { id: "test_co_level", label: "Test (CO Level)" },
  { id: "test_sample_answer", label: "Test (Sample Answer Sheets)" },
  { id: "test_qp_second", label: "Test (QP) – Second" },
  { id: "test_co_level_second", label: "Test (CO Level) – Second" },
  {
    id: "test_sample_answer_second",
    label: "Test (Sample Answer Sheets) – Second",
  },
  { id: "assignment_qp", label: "Assignment (QP)" },
  { id: "assignment_co_level", label: "Assignment (CO Level)" },
  { id: "assignment_sample", label: "Assignment (Sample)" },
  { id: "assignment_qp_second", label: "Assignment (QP) – Second" },
  { id: "assignment_co_level_second", label: "Assignment (CO Level) – Second" },
  { id: "assignment_sample_second", label: "Assignment (Sample) – Second" },
  { id: "sample_tutorial", label: "Sample Tutorial" },
  { id: "attendance", label: "Attendance (%)" },
  { id: "internal_marks", label: "Internal Marks Display" },
  { id: "course_exit_survey", label: "Course Exit Survey" },
  { id: "attainment_calculation", label: "Attainment Calculation" },
  { id: "score", label: "Score (Faculty/Auditor)" },
];

const labCourseFileChecklist: ChecklistItem[] = [
  { id: "co_po_mapping", label: "CO–PO Mapping" },
  { id: "co_pso_mapping", label: "CO–PSO Mapping" },
  { id: "justification", label: "Justification of Mapping" },
  { id: "course_coverage", label: "Course File Coverage" },
  { id: "course_execution", label: "Course Execution" },
  { id: "continuous_evaluation", label: "Continuous Evaluation" },
  { id: "internal_test_conducted", label: "Internal Test Conducted" },
  { id: "internal_test_qp", label: "Internal Test Question Paper" },
  { id: "internal_test_answers", label: "Internal Test Answer Sheets" },
  { id: "internal_test_marks", label: "Internal Test Mark Display" },
  { id: "internal_total_marks", label: "Internal Total Marks" },
  { id: "attendance", label: "Attendance (%)" },
  { id: "assignment_record", label: "Assignment / Record" },
  { id: "record_continuous_eval", label: "Record Continuous Evaluation" },
  { id: "course_exit_survey", label: "Course Exit Survey" },
  { id: "sample_record", label: "Sample Record" },
  { id: "mark_calculation", label: "Mark Calculation" },
];

const eventReportChecklist: ChecklistItem[] = [
  { id: "event_title", label: "Event Title" },
  { id: "event_type", label: "Event Type" },
  { id: "date_time", label: "Date & Time" },
  { id: "venue", label: "Venue" },
  { id: "organizing_department", label: "Organizing Department / Club" },
  { id: "event_coordinator", label: "Event Coordinator Details" },
  { id: "proposal_approval", label: "Event Proposal Approval" },
  { id: "budget_approval", label: "Budget Approval" },
  { id: "resource_planning", label: "Resource Planning" },
  { id: "poster_brochure", label: "Event Poster / Brochure" },
  { id: "publicity_done", label: "Publicity Done" },
  { id: "participant_registration", label: "Participant Registration" },
  { id: "attendance_record", label: "Attendance Record" },
  { id: "participant_list", label: "Participant List" },
  { id: "feedback_collection", label: "Feedback Collection" },
  { id: "photos_media", label: "Photos / Media Evidence" },
  { id: "event_report_doc", label: "Event Report Document" },
  { id: "supporting_docs", label: "Supporting Documents" },
  { id: "outcomes", label: "Outcome / Objectives Achieved" },
  { id: "learning_impact", label: "Learning / Impact" },
  { id: "budget_utilization", label: "Budget Utilization" },
  { id: "sponsorship_details", label: "Sponsorship Details" },
];

const isTheoryCourseCode = (code: string) => {
  const lastLetter = (code.match(/[a-zA-Z](?!.*[a-zA-Z])/g) ?? [""])[0];
  return lastLetter.toLowerCase() === "t";
};

const getChecklistForCourse = (code: string) =>
  isTheoryCourseCode(code) ? theoryCourseFileChecklist : labCourseFileChecklist;

export function AuditReviewInterface({
  type,
  item,
  facultyName,
  facultyId,
  onBack,
}: AuditReviewInterfaceProps) {
  const { user } = useAuth();
  const [checkedItems, setCheckedItems] = useState<
    Record<string, "yes" | "no" | "pending">
  >({});
  const [auditorRemarks, setAuditorRemarks] = useState("");
  const [reviewDecision, setReviewDecision] = useState<
    "approve" | "reject" | null
  >(null);

  const courseCode =
    type === "file" ? ((item as { courseCode?: string }).courseCode ?? "") : "";
  const checklist =
    type === "file" ? getChecklistForCourse(courseCode) : eventReportChecklist;

  const handleChecklistChange = (
    itemId: string,
    value: "yes" | "no" | "pending",
  ) => {
    setCheckedItems({
      ...checkedItems,
      [itemId]: value,
    });
  };

  const handleSubmitReview = () => {
    toast.success(
      `${type === "file" ? "Course file" : "Event report"} ${reviewDecision}d successfully`,
    );
    onBack();
  };

  const handleSendRemarks = async () => {
    if (!auditorRemarks.trim()) {
      toast.error("Please provide remarks before sending");
      return;
    }

    const targetFacultyId =
      facultyId || (item as { facultyId?: string }).facultyId;
    if (!targetFacultyId) {
      toast.error("Faculty ID is missing. Unable to send remarks.");
      return;
    }

    const entityType = type === "file" ? "course-file" : "event-report";
    const threadId = `${entityType}:${item.id}`;

    try {
      await sendMessage({
        facultyId: targetFacultyId,
        auditorId: user?.id,
        entityType,
        entityId: item.id,
        threadId,
        senderRole: "auditor",
        senderName: user?.name,
        message: auditorRemarks,
        status: "pending",
      });

      setAuditorRemarks("");
      toast.success("Remarks sent successfully");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Send remarks error:", error);
      toast.error("Failed to send remarks");
    }
  };

  const handleDownloadSheet = () => {
    // Create CSV content
    let csvContent = "Checklist Item,Status\n";
    checklist.forEach((item) => {
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
    const itemName =
      type === "file"
        ? (item as any).fileName
        : (item as any).eventName?.replace(/ /g, "_") || "report";
    link.download = `audit-${facultyName.replace(/ /g, "_")}-${itemName}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Audit sheet downloaded successfully");
  };

  const handleDownloadDocument = () => {
    if (type === "file") {
      const fileItem = item as {
        id: string;
        fileName: string;
        documentUrl?: string;
      };

      if (fileItem.documentUrl) {
        const link = document.createElement("a");
        link.href = `/api/course-files/${encodeURIComponent(fileItem.id)}/download`;
        link.download = fileItem.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${fileItem.fileName}`);
        return;
      }
    }

    const itemName =
      type === "file"
        ? (item as { fileName: string }).fileName
        : (item as { eventName: string }).eventName;
    toast.error(`No document available to download for ${itemName}`);
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
                className={
                  reviewDecision === "approve"
                    ? "bg-green-100 text-green-800"
                    : ""
                }
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
          <DocumentViewer
            type={type}
            item={item}
            onDownload={handleDownloadDocument}
          />

          {/* Document Details */}
          <DocumentDetails type={type} item={item} />

          {/* Auditor Remarks */}
          <AuditorRemarks
            type={type}
            item={item}
            auditorRemarks={auditorRemarks}
            onRemarksChange={setAuditorRemarks}
            onSendRemarks={handleSendRemarks}
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
