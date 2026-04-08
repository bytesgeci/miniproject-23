"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  AuditChecklistStatus,
  CourseAuditChecklistReport,
} from "@/components/CourseFileManager/types";

interface CourseFileRecord {
  id: string;
  fileName: string;
  documentUrl?: string;
  fileUrl?: string;
  filePath?: string;
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: string;
  fileType: string;
  uploadDate: string;
  facultyId?: string;
  facultyName?: string;
  status?: "Pending" | "Approved" | "Rejected" | string;
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  auditChecklistStatus?: AuditChecklistStatus;
  auditChecklistFinalized?: boolean;
  auditChecklistReport?: CourseAuditChecklistReport;
}

interface SemesterGroup {
  semester: string;
  files: CourseFileRecord[];
}

interface BatchGroup {
  batch: string;
  totalFiles: number;
  semesterCount: number;
  semesters: SemesterGroup[];
}

interface CourseGroup {
  key: string;
  courseCode: string;
  courseName: string;
  files: CourseFileRecord[];
}

interface UserCourseFilesExplorerProps {
  batchGroups: BatchGroup[];
}

interface ChecklistTemplateItem {
  id: string;
  label: string;
}

const THEORY_CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  { id: "co_po_mapping", label: "CO-PO Mapping (CO-PO Mapping Level)" },
  { id: "co_pso_mapping", label: "CO-PO Mapping (CO-PSO Mapping Level)" },
  { id: "justification", label: "Justification of Mapping" },
  { id: "course_coverage", label: "Course File Coverage" },
  { id: "test_qp", label: "Test (QP)" },
  { id: "test_co_level", label: "Test (CO Level)" },
  { id: "test_sample_answer", label: "Test (Sample Answer Sheets)" },
  { id: "test_qp_second", label: "Test (QP) - Second" },
  { id: "test_co_level_second", label: "Test (CO Level) - Second" },
  {
    id: "test_sample_answer_second",
    label: "Test (Sample Answer Sheets) - Second",
  },
  { id: "assignment_qp", label: "Assignment (QP)" },
  { id: "assignment_co_level", label: "Assignment (CO Level)" },
  { id: "assignment_sample", label: "Assignment (Sample)" },
  { id: "assignment_qp_second", label: "Assignment (QP) - Second" },
  { id: "assignment_co_level_second", label: "Assignment (CO Level) - Second" },
  { id: "assignment_sample_second", label: "Assignment (Sample) - Second" },
  { id: "sample_tutorial", label: "Sample Tutorial" },
  { id: "attendance", label: "Attendance (%)" },
  { id: "internal_marks", label: "Internal Marks Display" },
  { id: "course_exit_survey", label: "Course Exit Survey" },
  { id: "attainment_calculation", label: "Attainment Calculation" },
  { id: "review_completed", label: "Review Completed" },
];

const LAB_CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  { id: "co_po_mapping", label: "CO-PO Mapping" },
  { id: "co_pso_mapping", label: "CO-PSO Mapping" },
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

function getChecklistBadgeClass(status: AuditChecklistStatus) {
  if (status === "yes") {
    return "bg-green-100 text-green-800 border-green-200";
  }
  if (status === "no") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-amber-100 text-amber-800 border-amber-200";
}

function getDocumentUrl(file: CourseFileRecord) {
  return file.documentUrl || file.fileUrl || file.filePath || "";
}

function normalizeChecklistStatus(
  value: unknown,
): AuditChecklistStatus | undefined {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "yes" || normalized === "no" || normalized === "pending") {
    return normalized;
  }

  return undefined;
}

function toChecklistId(label: string, index: number) {
  const normalized = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `item-${index + 1}`;
}

function isTheoryCourseCode(courseCode: string) {
  const lastLetter = (courseCode.match(/[a-zA-Z](?!.*[a-zA-Z])/g) ?? [""])[0];
  return lastLetter.toLowerCase() === "t";
}

function getChecklistTemplate(courseCode: string) {
  return isTheoryCourseCode(courseCode)
    ? THEORY_CHECKLIST_TEMPLATE
    : LAB_CHECKLIST_TEMPLATE;
}

function buildChecklistEntries(courseGroup: CourseGroup) {
  const files = courseGroup.files;
  const reportChecklist = files.find(
    (courseFile) => courseFile.auditChecklistReport?.checklist?.length,
  )?.auditChecklistReport?.checklist;

  const statusById = new Map<string, AuditChecklistStatus>();
  const statusByLabel = new Map<string, AuditChecklistStatus>();

  if (Array.isArray(reportChecklist) && reportChecklist.length > 0) {
    reportChecklist.forEach((item) => {
      const normalizedStatus =
        normalizeChecklistStatus(item.status) || "pending";
      statusById.set(item.id, normalizedStatus);
      statusByLabel.set(item.label.trim().toLowerCase(), normalizedStatus);
    });
  }

  files.forEach((file) => {
    const label = String(file.fileType || "").trim();
    if (!label) {
      return;
    }

    const normalizedStatus =
      normalizeChecklistStatus(file.auditChecklistStatus) || "pending";

    // Preserve first non-pending value seen for a file type.
    const normalizedLabel = label.toLowerCase();
    if (
      !statusByLabel.has(normalizedLabel) ||
      statusByLabel.get(normalizedLabel) === "pending"
    ) {
      statusByLabel.set(normalizedLabel, normalizedStatus);
    }
  });

  const template = getChecklistTemplate(courseGroup.courseCode);
  return template.map((item, index) => ({
    id: item.id || toChecklistId(item.label, index),
    label: item.label,
    status:
      statusById.get(item.id) ||
      statusByLabel.get(item.label.trim().toLowerCase()) ||
      "pending",
  }));
}

function groupFilesByCourse(files: CourseFileRecord[]): CourseGroup[] {
  const grouped = files.reduce<Record<string, CourseGroup>>((acc, file) => {
    const courseCode = file.courseCode || "Unknown";
    const courseName = file.courseName || courseCode;
    const key = `${courseCode}|${courseName}`;

    if (!acc[key]) {
      acc[key] = {
        key,
        courseCode,
        courseName,
        files: [],
      };
    }

    acc[key].files.push(file);
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => {
    const courseA = `${a.courseCode}|${a.courseName}`.toLowerCase();
    const courseB = `${b.courseCode}|${b.courseName}`.toLowerCase();
    return courseA.localeCompare(courseB);
  });
}

export function UserCourseFilesExplorer({
  batchGroups,
}: UserCourseFilesExplorerProps) {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [openSemester, setOpenSemester] = useState<string>("");
  const [selectedCourseGroup, setSelectedCourseGroup] =
    useState<CourseGroup | null>(null);
  const [selectedCourseScope, setSelectedCourseScope] = useState<string>("");
  const [showMergedPreview, setShowMergedPreview] = useState(false);
  const [previewRenderReady, setPreviewRenderReady] = useState(false);
  const [visibleCountBySemester, setVisibleCountBySemester] = useState<
    Record<string, number>
  >({});
  const previewRenderTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewRenderTimerRef.current !== null) {
        window.clearTimeout(previewRenderTimerRef.current);
      }
    };
  }, []);

  const selectedGroup = selectedBatch
    ? (batchGroups.find((group) => group.batch === selectedBatch) ?? null)
    : null;
  const selectedChecklistEntries = useMemo(
    () =>
      selectedCourseGroup ? buildChecklistEntries(selectedCourseGroup) : [],
    [selectedCourseGroup],
  );

  const toggleMergedPreview = () => {
    if (showMergedPreview) {
      setShowMergedPreview(false);
      setPreviewRenderReady(false);
      if (previewRenderTimerRef.current !== null) {
        window.clearTimeout(previewRenderTimerRef.current);
        previewRenderTimerRef.current = null;
      }
      return;
    }

    // Flip button state immediately, then defer heavy preview render.
    setShowMergedPreview(true);
    setPreviewRenderReady(false);
    if (previewRenderTimerRef.current !== null) {
      window.clearTimeout(previewRenderTimerRef.current);
    }
    previewRenderTimerRef.current = window.setTimeout(() => {
      setPreviewRenderReady(true);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Navigate Course Files
          </p>
          <p className="text-xs text-slate-600">
            Batch view to semester view with one shared checklist per course.
          </p>
        </div>
        {selectedBatch ? (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedBatch(null);
              setOpenSemester("");
              setSelectedCourseGroup(null);
              setSelectedCourseScope("");
              setShowMergedPreview(false);
              setPreviewRenderReady(false);
            }}
          >
            Back to Batches
          </Button>
        ) : (
          <Button disabled>Choose a Batch Card</Button>
        )}
      </div>

      {selectedBatch === null ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batchGroups.length === 0 ? (
            <p className="text-sm text-slate-600">
              No auditor-approved course files found.
            </p>
          ) : (
            batchGroups.map((group) => {
              return (
                <button
                  key={group.batch}
                  type="button"
                  onClick={() => {
                    setSelectedBatch(group.batch);
                    setOpenSemester("");
                    setSelectedCourseGroup(null);
                    setSelectedCourseScope("");
                    setShowMergedPreview(false);
                    setPreviewRenderReady(false);
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  <p className="text-lg font-semibold text-slate-900">
                    Batch {group.batch}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Approved Files: {group.totalFiles}
                  </p>
                  <p className="text-sm text-slate-600">
                    Semesters with uploads: {group.semesterCount}
                  </p>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
              Batch {selectedBatch}
            </h3>
            <Badge variant="secondary">Approved Only</Badge>
          </div>

          {!selectedGroup || selectedGroup.semesters.length === 0 ? (
            <p className="text-sm text-slate-600">
              No semester uploads found for this batch.
            </p>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={openSemester}
              onValueChange={setOpenSemester}
              className="w-full space-y-2"
            >
              {selectedGroup.semesters.map(({ semester, files }) => (
                <AccordionItem
                  key={semester}
                  value={semester}
                  className="rounded-lg border border-slate-200 px-3"
                >
                  <AccordionTrigger className="text-base font-medium">
                    Semester: {semester} ({files.length} files)
                  </AccordionTrigger>
                  <AccordionContent>
                    {(() => {
                      const courseGroups = groupFilesByCourse(files);
                      const semesterScope = `${selectedBatch}|${semester}`;
                      const visibleGroups = visibleCountBySemester[semester]
                        ? courseGroups.slice(
                            0,
                            visibleCountBySemester[semester],
                          )
                        : courseGroups.slice(0, 10);

                      return (
                        <div className="space-y-3 pb-2">
                          {visibleGroups.map((courseGroup) => (
                            <div
                              key={courseGroup.key}
                              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium text-slate-900">
                                  {courseGroup.courseCode} -{" "}
                                  {courseGroup.courseName}
                                </p>
                                <Badge className="bg-green-100 text-green-800">
                                  {courseGroup.files.length}{" "}
                                  {courseGroup.files.length === 1
                                    ? "File"
                                    : "Files"}
                                </Badge>
                              </div>

                              <p className="mt-1 text-sm text-slate-700">
                                Click to view one shared checklist for this
                                course.
                              </p>
                              <div className="mt-3 flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const isSameSelection =
                                      selectedCourseGroup?.key ===
                                        courseGroup.key &&
                                      selectedCourseScope === semesterScope;

                                    if (isSameSelection) {
                                      setSelectedCourseGroup(null);
                                      setSelectedCourseScope("");
                                      setShowMergedPreview(false);
                                      setPreviewRenderReady(false);
                                      return;
                                    }

                                    setSelectedCourseGroup(courseGroup);
                                    setSelectedCourseScope(semesterScope);
                                    setShowMergedPreview(false);
                                    setPreviewRenderReady(false);
                                  }}
                                >
                                  {selectedCourseGroup?.key ===
                                    courseGroup.key &&
                                  selectedCourseScope === semesterScope
                                    ? "Hide Checklist"
                                    : "View Checklist"}
                                </Button>

                                {selectedCourseGroup?.key === courseGroup.key &&
                                  selectedCourseScope === semesterScope && (
                                    <Button
                                      size="sm"
                                      onClick={toggleMergedPreview}
                                    >
                                      {showMergedPreview
                                        ? "Hide All Documents"
                                        : "Preview All Documents"}
                                    </Button>
                                  )}
                              </div>
                            </div>
                          ))}

                          {courseGroups.length >
                            (visibleCountBySemester[semester] || 10) && (
                            <div className="flex justify-center pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setVisibleCountBySemester((prev) => ({
                                    ...prev,
                                    [semester]: (prev[semester] || 10) + 10,
                                  }))
                                }
                              >
                                Show More Files
                              </Button>
                            </div>
                          )}

                          {selectedCourseGroup &&
                            selectedCourseScope === semesterScope && (
                              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-900">
                                    Checklist - {selectedCourseGroup.courseCode}{" "}
                                    - {selectedCourseGroup.courseName}
                                  </p>
                                </div>

                                {selectedChecklistEntries.length ? (
                                  <div className="mt-3 space-y-2">
                                    {selectedChecklistEntries.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-2"
                                      >
                                        <p className="text-sm text-slate-700">
                                          {item.label}
                                        </p>
                                        <Badge
                                          className={getChecklistBadgeClass(
                                            item.status,
                                          )}
                                        >
                                          {item.status.toUpperCase()}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-600">
                                    No checklist details available.
                                  </p>
                                )}

                                {showMergedPreview && !previewRenderReady && (
                                  <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                    Preparing previews...
                                  </div>
                                )}

                                {showMergedPreview && previewRenderReady && (
                                  <div className="mt-4 space-y-4">
                                    {selectedCourseGroup.files.map(
                                      (courseFile) => {
                                        const documentUrl =
                                          getDocumentUrl(courseFile);
                                        const lowerName =
                                          courseFile.fileName.toLowerCase();
                                        const isImage =
                                          lowerName.endsWith(".png") ||
                                          lowerName.endsWith(".jpg") ||
                                          lowerName.endsWith(".jpeg") ||
                                          lowerName.endsWith(".webp") ||
                                          lowerName.endsWith(".gif");

                                        return (
                                          <div
                                            key={courseFile.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                          >
                                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                              <p className="text-sm font-medium text-slate-900">
                                                {courseFile.fileName}
                                              </p>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!documentUrl}
                                                onClick={() => {
                                                  if (!documentUrl) return;
                                                  const link =
                                                    document.createElement("a");
                                                  link.href = documentUrl;
                                                  link.download =
                                                    courseFile.fileName;
                                                  document.body.appendChild(
                                                    link,
                                                  );
                                                  link.click();
                                                  document.body.removeChild(
                                                    link,
                                                  );
                                                }}
                                              >
                                                Download
                                              </Button>
                                            </div>

                                            {documentUrl ? (
                                              isImage ? (
                                                <img
                                                  src={documentUrl}
                                                  alt={courseFile.fileName}
                                                  className="max-h-125 w-full rounded border object-contain bg-white"
                                                />
                                              ) : (
                                                <iframe
                                                  src={documentUrl}
                                                  title={courseFile.fileName}
                                                  className="h-150 w-full rounded border bg-white"
                                                />
                                              )
                                            ) : (
                                              <p className="text-sm text-slate-600">
                                                Document preview is not
                                                available for this file.
                                              </p>
                                            )}
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      );
                    })()}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
