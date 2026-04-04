"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import { ArrowLeft, Download, Send } from "lucide-react";
import { toast } from "sonner";
import { ChecklistSidebar } from "./ChecklistSidebar";
import { ChecklistItem } from "./types";
import {
  CourseAuditChecklistReport,
  CourseFile,
} from "../FacultyAuditPortfolio/types";
import { useAuth } from "@/context/AuthContext";
import { sendMessagesBatch } from "@/lib/messageClient";

// ── Checklists (mirrored from AuditReviewInterface/index.tsx) ──────────────

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
  { id: "review_completed", label: "Review Completed" },
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

const isTheoryCourseCode = (code: string) => {
  const lastLetter = (code.match(/[a-zA-Z](?!.*[a-zA-Z])/g) ?? [""])[0];
  return lastLetter.toLowerCase() === "t";
};

const getChecklistForCourse = (code: string) =>
  isTheoryCourseCode(code) ? theoryCourseFileChecklist : labCourseFileChecklist;

const normalizeChecklistStatus = (
  value?: string,
): "yes" | "no" | "pending" | undefined => {
  if (value === "yes" || value === "no" || value === "pending") {
    return value;
  }
  return undefined;
};

// ── Sort helpers ──────────────────────────────────────────────────────────────

function sortFilesByChecklist(
  files: CourseFile[],
  checklist: ChecklistItem[],
): CourseFile[] {
  const order = checklist.map((c) => c.label);
  return [...files].sort((a, b) => {
    const ai = order.indexOf(a.fileType);
    const bi = order.indexOf(b.fileType);
    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
  });
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface CourseReviewGroup {
  courseCode: string;
  courseName: string;
  academicYear: string;
  files: CourseFile[];
}

interface CourseReviewInterfaceProps {
  group: CourseReviewGroup;
  facultyName: string;
  facultyId?: string;
  onBack: () => void;
  onReviewCompleted?: (updatedFiles: CourseFile[]) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CourseReviewInterface({
  group,
  facultyName,
  facultyId,
  onBack,
  onReviewCompleted,
}: CourseReviewInterfaceProps) {
  const { user } = useAuth();

  const checklist = getChecklistForCourse(group.courseCode);
  const sortedFiles = sortFilesByChecklist(group.files, checklist);

  const existingChecklistReport =
    sortedFiles.find((file) => file.auditChecklistReport)
      ?.auditChecklistReport ?? null;

  const initialCheckedItems = checklist.reduce<
    Record<string, "yes" | "no" | "pending">
  >((accumulator, item) => {
    const reportStatus = normalizeChecklistStatus(
      existingChecklistReport?.checklist.find(
        (entry) => entry.id === item.id || entry.label === item.label,
      )?.status,
    );
    if (reportStatus) {
      accumulator[item.id] = reportStatus;
      return accumulator;
    }

    const matchingFileStatus = normalizeChecklistStatus(
      sortedFiles.find((file) => file.fileType === item.label)
        ?.auditChecklistStatus,
    );
    if (matchingFileStatus) {
      accumulator[item.id] = matchingFileStatus;
    }
    return accumulator;
  }, {});

  const [checkedItems, setCheckedItems] =
    useState<Record<string, "yes" | "no" | "pending">>(initialCheckedItems);
  const [auditorRemarks, setAuditorRemarks] = useState(
    existingChecklistReport?.remarks ?? sortedFiles[0]?.auditorRemarks ?? "",
  );
  const [showFilePreviews, setShowFilePreviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buildChecklistReport = (
    isFinalized: boolean,
  ): CourseAuditChecklistReport => ({
    courseCode: group.courseCode,
    courseName: group.courseName,
    academicYear: group.academicYear,
    checklist: checklist.map((item) => ({
      id: item.id,
      label: item.label,
      status: checkedItems[item.id] ?? "pending",
    })),
    remarks: auditorRemarks.trim() || undefined,
    updatedBy: user?.name ?? "Auditor",
    updatedAt: new Date().toISOString(),
    isFinalized,
  });

  const handleChecklistChange = (
    itemId: string,
    value: "yes" | "no" | "pending",
  ) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleDownloadSheet = () => {
    let csv = "Checklist Item,Status\n";
    checklist.forEach((ci) => {
      csv += `"${ci.label}",${checkedItems[ci.id] ?? "pending"}\n`;
    });
    csv += `\nRemarks,"${auditorRemarks}"\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${facultyName.replace(/ /g, "_")}-${group.courseCode}-${group.academicYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit sheet downloaded");
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    const checklistReport = buildChecklistReport(false);
    const statusByLabel = new Map(
      checklistReport.checklist.map((entry) => [entry.label, entry.status]),
    );
    const updatedFiles: CourseFile[] = [];

    try {
      for (const file of sortedFiles) {
        const res = await fetch(`/api/course-files/${file.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auditorRemarks: auditorRemarks.trim() || file.auditorRemarks,
            auditChecklistStatus: statusByLabel.get(file.fileType) ?? "pending",
            auditChecklistUpdatedAt: checklistReport.updatedAt,
            auditChecklistFinalized: false,
            auditChecklistReport: checklistReport,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(
            data.error || `Failed to save draft for ${file.fileName}`,
          );
          setIsSubmitting(false);
          return;
        }

        const updated = (data.files as CourseFile[]).find(
          (f) => f.id === file.id,
        );
        if (updated) {
          updatedFiles.push(updated);
        }
      }

      onReviewCompleted?.(updatedFiles);
      toast.success("Checklist draft saved");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Checklist draft save error:", error);
      toast.error("Failed to save checklist draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendRemarks = async () => {
    const text = auditorRemarks.trim();
    if (!text) {
      toast.error("Please provide remarks before sending");
      return;
    }
    if (!facultyId) {
      toast.error("Faculty ID is missing. Unable to send remarks.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendMessagesBatch(
        sortedFiles.map((file) => ({
          facultyId,
          auditorId: user?.id,
          entityType: "course-file",
          entityId: file.id,
          threadId: `course-file:${file.id}`,
          senderRole: "auditor",
          senderName: user?.name,
          message: text,
          status: "pending",
        })),
      );

      if (result.failed > 0) {
        toast.error(
          `Sent ${result.sent}/${sortedFiles.length} messages. ${result.errors[0] || "Some messages failed."}`,
        );
        return;
      }

      setAuditorRemarks("");
      toast.success(`Remarks sent to ${result.sent} file thread(s)`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Send remarks error:", error);
      toast.error("Failed to send remarks");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    const allChecked = checklist.every((ci) => {
      const status = checkedItems[ci.id];
      return status === "yes" || status === "no";
    });
    if (!allChecked) {
      toast.error("Please complete all checklist items");
      return;
    }

    setIsSubmitting(true);
    const status = "Approved";
    const reviewedDate = new Date().toISOString().split("T")[0];
    const reviewerName = user?.name ?? "Auditor";
    const checklistReport = buildChecklistReport(true);
    const statusByLabel = new Map(
      checklistReport.checklist.map((entry) => [entry.label, entry.status]),
    );
    const updatedFiles: CourseFile[] = [];

    try {
      for (const file of sortedFiles) {
        const res = await fetch(`/api/course-files/${file.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            adminRemarks: auditorRemarks.trim() || undefined,
            auditorRemarks: auditorRemarks.trim() || undefined,
            reviewedBy: reviewerName,
            reviewedDate,
            auditChecklistStatus: statusByLabel.get(file.fileType) ?? "pending",
            auditChecklistUpdatedAt: checklistReport.updatedAt,
            auditChecklistFinalized: true,
            auditChecklistReport: checklistReport,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Failed to update ${file.fileName}`);
          setIsSubmitting(false);
          return;
        }
        const updated = (data.files as CourseFile[]).find(
          (f) => f.id === file.id,
        );
        if (updated) updatedFiles.push(updated);

        // Post audit record
        await fetch("/api/audits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auditorId: user?.id,
            entityType: "course-file",
            entityId: file.id,
            status: "completed",
            remarks: auditorRemarks.trim() || undefined,
          }),
        });

        // Post remark if remarks provided
        if (auditorRemarks.trim()) {
          await fetch("/api/remarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              authorId: user?.id,
              entityType: "course-file",
              entityId: file.id,
              status: "published",
              text: auditorRemarks,
            }),
          });
        }
      }

      // Post a message on each file thread so faculty can see it in file-level dialogs.
      if (facultyId && sortedFiles.length > 0) {
        const completionMessage =
          auditorRemarks.trim() ||
          `Course ${group.courseCode} (${group.academicYear}) review completed.`;

        const messageResult = await sendMessagesBatch(
          sortedFiles.map((file) => ({
            facultyId,
            auditorId: user?.id,
            entityType: "course-file",
            entityId: file.id,
            threadId: `course-file:${file.id}`,
            senderRole: "auditor",
            senderName: user?.name,
            message: completionMessage,
            status: "completed",
          })),
        );

        if (messageResult.failed > 0) {
          toast.error(
            `Review saved, but ${messageResult.failed} notification message(s) failed to send.`,
          );
        }
      }

      onReviewCompleted?.(updatedFiles);
      toast.success(
        `${group.courseCode} (${group.academicYear}) review submitted successfully`,
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
      onBack();
    } catch (err) {
      console.error("Course review submit error:", err);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} type="button">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Faculty List
        </Button>
        <Button variant="outline" onClick={handleDownloadSheet} type="button">
          <Download className="h-4 w-4 mr-2" />
          Download Audit Sheet
        </Button>
      </div>

      {/* Course info bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-medium">{facultyName}</h3>
              <p className="text-sm text-gray-600">
                {group.courseCode} — {group.courseName} ({group.academicYear})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main layout: checklist left | documents right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Checklist sidebar (sticky) */}
        <ChecklistSidebar
          checklist={checklist}
          checkedItems={checkedItems}
          onChecklistChange={handleChecklistChange}
        />

        {/* Right pane: files list + optional previews + remarks */}
        <div className="lg:col-span-3 space-y-6">
          {/* Files list with optional previews */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle>Course Files ({sortedFiles.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowFilePreviews((prev) => !prev)}
                >
                  {showFilePreviews ? "Hide Previews" : "Preview All Documents"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedFiles.map((file, idx) => {
                  const checklistPos = checklist.findIndex(
                    (c) => c.label === file.fileType,
                  );
                  const posLabel =
                    checklistPos !== -1 ? `#${checklistPos + 1}` : `Extra`;
                  const documentUrl =
                    file.documentUrl ||
                    (file as { fileUrl?: string }).fileUrl ||
                    (file as { filePath?: string }).filePath ||
                    "";
                  const lowerName = file.fileName.toLowerCase();
                  const isImage =
                    lowerName.endsWith(".png") ||
                    lowerName.endsWith(".jpg") ||
                    lowerName.endsWith(".jpeg") ||
                    lowerName.endsWith(".webp") ||
                    lowerName.endsWith(".gif");

                  return (
                    <div
                      key={file.id}
                      className="p-3 border rounded-lg bg-gray-50 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded shrink-0">
                            {posLabel}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {file.fileType}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {file.fileName}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            file.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : file.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {file.status}
                        </Badge>
                      </div>

                      {showFilePreviews && (
                        <div className="rounded border bg-white p-2">
                          {documentUrl ? (
                            isImage ? (
                              <img
                                src={documentUrl}
                                alt={file.fileName}
                                className="max-h-125 w-full rounded border object-contain bg-white"
                              />
                            ) : (
                              <iframe
                                src={documentUrl}
                                title={file.fileName}
                                className="h-150 w-full rounded border bg-white"
                              />
                            )
                          ) : (
                            <p className="text-sm text-gray-600">
                              Preview is not available for this file.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Auditor Remarks & Submit */}
          <Card>
            <CardHeader>
              <CardTitle>
                Auditor Remarks{" "}
                <span className="text-xs font-normal text-gray-500">
                  (Optional)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Provide detailed feedback and remarks for this review (optional)..."
                  value={auditorRemarks}
                  onChange={(e) => setAuditorRemarks(e.target.value)}
                  rows={6}
                />
                <Button
                  variant="default"
                  size="default"
                  onClick={handleSendRemarks}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Remarks To Faculty
                </Button>
              </div>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                className="w-full"
                size="lg"
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? "Saving…" : "Save Checklist Draft"}
              </Button>
              <Button
                onClick={handleSubmitReview}
                className="w-full"
                size="lg"
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? "Submitting…" : "Submit Review"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
