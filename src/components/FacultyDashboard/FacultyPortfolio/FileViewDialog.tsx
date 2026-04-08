import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Alert, AlertDescription } from "../../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Download, Eye, FileText, MessageCircle } from "lucide-react";
import { CourseFile } from "./types";
import { EntityMessagesPanel } from "../../shared/messages/EntityMessagesPanel";
import { useAuth } from "@/context/AuthContext";
import { useMemo, useState } from "react";

interface FileViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: CourseFile | null;
  getStatusColor: (status: string) => string;
  facultyId?: string;
}

export function FileViewDialog({
  open,
  onOpenChange,
  file,
  getStatusColor,
  facultyId,
}: FileViewDialogProps) {
  const { user } = useAuth();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const normalizeIdentity = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const ownerFacultyIdentity = normalizeIdentity(facultyId || file?.facultyId);
  const viewerIdentities = useMemo(
    () =>
      new Set(
        [user?.id, user?.username, user?.name]
          .map((value) => normalizeIdentity(value))
          .filter(Boolean),
      ),
    [user?.id, user?.name, user?.username],
  );

  const isResponsibleFaculty =
    Boolean(ownerFacultyIdentity) && viewerIdentities.has(ownerFacultyIdentity);

  const publicReviewText =
    file?.adminRemarks || file?.auditChecklistReport?.remarks || "";

  const documentUrl =
    file?.documentUrl ||
    String(
      (file as (CourseFile & { fileUrl?: string; filePath?: string }) | null)
        ?.fileUrl || "",
    ) ||
    String(
      (file as (CourseFile & { fileUrl?: string; filePath?: string }) | null)
        ?.filePath || "",
    );

  const lowerName = String(file?.fileName || "").toLowerCase();
  const isImage =
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".webp") ||
    lowerName.endsWith(".gif");

  const showPublicReview =
    Boolean(publicReviewText) ||
    Boolean(file?.reviewedBy) ||
    Boolean(file?.reviewedDate) ||
    Boolean(file?.auditChecklistReport?.decision);

  const openInNewTab = () => {
    if (!documentUrl || typeof window === "undefined") return;
    window.open(documentUrl, "_blank", "noopener,noreferrer");
  };

  const downloadFile = () => {
    if (!documentUrl || typeof window === "undefined") return;
    const link = document.createElement("a");
    link.href = documentUrl;
    link.download = file?.fileName || "course-file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{file?.fileName}</DialogTitle>
            <DialogDescription>
              <Badge className={getStatusColor(file?.status || "")}>
                {file?.status}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          {file && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Course Code</p>
                  <p className="font-medium">{file.courseCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Batch / Academic Year</p>
                  <p className="font-medium">{file.academicYear || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">File Type</p>
                  <p className="font-medium">{file.fileType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Upload Date</p>
                  <p className="font-medium">{file.uploadDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course Name</p>
                  <p className="font-medium">{file.courseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-medium">{file.semester}</p>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm">
                  This is a read-only view of the course file. You can review
                  the details but cannot make changes.
                </AlertDescription>
              </Alert>

              {showPublicReview && (
                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Review Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {publicReviewText ? (
                      <p className="text-sm text-slate-800">
                        {publicReviewText}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Reviewed. No additional public summary was provided.
                      </p>
                    )}

                    {(file.reviewedBy || file.reviewedDate) && (
                      <p className="text-xs text-slate-500">
                        {file.reviewedBy
                          ? `Reviewed by ${file.reviewedBy}`
                          : "Reviewed"}
                        {file.reviewedDate ? ` on ${file.reviewedDate}` : ""}
                      </p>
                    )}

                    {file.auditChecklistReport?.decision && (
                      <p className="text-xs text-slate-500">
                        Decision:{" "}
                        {file.auditChecklistReport.decision.toUpperCase()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Auditor Remarks */}
              {isResponsibleFaculty && file.auditorRemarks && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Auditor Remarks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-900">
                      {file.auditorRemarks}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Messages & Discussion */}
              {isResponsibleFaculty && file && facultyId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Discussion with Auditor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EntityMessagesPanel
                      facultyId={facultyId}
                      entityType="course-file"
                      entityId={file.id}
                      itemType="file"
                    />
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!documentUrl}
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview File
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!documentUrl}
                  onClick={downloadFile}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>

              {!documentUrl && (
                <p className="text-sm text-slate-600">
                  Document preview/download is not available for this file.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-[96vw]! max-w-[96vw]! sm:w-[92vw]! sm:max-w-[92vw]! lg:w-[82vw]! lg:max-w-[82vw]! xl:w-[78vw]! xl:max-w-[78vw]! 2xl:w-[75vw]! 2xl:max-w-[75vw]!">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>{file?.fileName}</DialogDescription>
          </DialogHeader>

          {documentUrl ? (
            isImage ? (
              <img
                src={documentUrl}
                alt={file?.fileName || "Course file preview"}
                className="max-h-[78vh] w-full rounded-md border border-slate-200 object-contain bg-white"
              />
            ) : (
              <iframe
                src={documentUrl}
                title={file?.fileName || "Course file preview"}
                className="h-[82vh] w-full rounded-md border border-slate-200"
              />
            )
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Preview is not available for this file.
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={openInNewTab}
              disabled={!documentUrl}
            >
              Open in new tab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
