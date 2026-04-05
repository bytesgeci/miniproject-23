"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  Eye,
  Folder,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PeerReviewDialog } from "@/components/shared/dialogs/PeerReviewDialog";
import { CourseFile } from "./types";
import { useAuth } from "@/context/AuthContext";
import { EntityMessagesPanel } from "@/components/shared/messages/EntityMessagesPanel";
import {
  downloadFromServer,
  downloadTextFile,
  sanitizeFileName,
} from "@/lib/download";
import {
  getStandardBatchYearOptions,
  isValidBatchYear,
  normalizeBatchYear,
} from "@/lib/batchYear";

const theoryFileTypes = [
  "CO\u2013PO Mapping (CO\u2013PO Mapping Level)",
  "CO\u2013PO Mapping (CO\u2013PSO Mapping Level)",
  "Justification of Mapping",
  "Course File Coverage",
  "Test (QP)",
  "Test (CO Level)",
  "Test (Sample Answer Sheets)",
  "Test (QP) \u2013 Second",
  "Test (CO Level) \u2013 Second",
  "Test (Sample Answer Sheets) \u2013 Second",
  "Assignment (QP)",
  "Assignment (CO Level)",
  "Assignment (Sample)",
  "Assignment (QP) \u2013 Second",
  "Assignment (CO Level) \u2013 Second",
  "Assignment (Sample) \u2013 Second",
  "Sample Tutorial",
  "Attendance (%)",
  "Internal Marks Display",
  "Course Exit Survey",
  "Attainment Calculation",
  "Score (Faculty/Auditor)",
];

const labFileTypes = [
  "CO\u2013PO Mapping",
  "CO\u2013PSO Mapping",
  "Justification of Mapping",
  "Course File Coverage",
  "Course Execution",
  "Continuous Evaluation",
  "Internal Test Conducted",
  "Internal Test Question Paper",
  "Internal Test Answer Sheets",
  "Internal Test Mark Display",
  "Internal Total Marks",
  "Attendance (%)",
  "Assignment / Record",
  "Record Continuous Evaluation",
  "Course Exit Survey",
  "Sample Record",
  "Mark Calculation",
];

const semesterOptions = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

const isTheoryCourseCode = (code: string) => {
  const lastLetter = (code.match(/[a-zA-Z](?!.*[a-zA-Z])/g) ?? [""])[0];
  return lastLetter.toLowerCase() === "t";
};

interface CourseFileManagerProps {
  initialFiles?: CourseFile[];
  fileCategories?: string[];
  fileTypes?: string[];
}

interface AuditorMessage {
  id: string;
  entityType: "course-file" | "event-report" | string;
  entityId: string;
  threadId?: string;
  senderRole?: "auditor" | "faculty" | string;
  createdAt?: string;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to read file data"));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Unable to read file data"));
    };
    reader.readAsDataURL(file);
  });

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delayMs, value]);

  return debounced;
}

const batchYearOptions = getStandardBatchYearOptions();

function getDefaultBatchYear() {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-${currentYear + 4}`;
}

export function CourseFileManager({
  initialFiles = [],
  fileCategories = [],
  fileTypes = [],
}: CourseFileManagerProps) {
  const [files, setFiles] = useState<CourseFile[]>(initialFiles);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(
    fileCategories
      .map((category) => String(category || "").trim())
      .filter(Boolean),
  );
  const [typeOptions, setTypeOptions] = useState<string[]>(
    fileTypes.map((type) => String(type || "").trim()).filter(Boolean),
  );
  const [loadingFiles, setLoadingFiles] = useState(initialFiles.length === 0);
  const { user, userRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [semester, setSemester] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState(getDefaultBatchYear());
  const [viewMode, setViewMode] = useState<"my-files" | "all-files">(
    "my-files",
  );
  const [selectedFile, setSelectedFile] = useState<CourseFile | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [expandedCourseChecklist, setExpandedCourseChecklist] = useState<
    Record<string, boolean>
  >({});
  const [pendingAuditorMessagesByFile, setPendingAuditorMessagesByFile] =
    useState<Record<string, number>>({});
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);

  const uploadTypeOptions = useMemo(
    () => (isTheoryCourseCode(courseCode) ? theoryFileTypes : labFileTypes),
    [courseCode],
  );

  useEffect(() => {
    if (selectedFileType && !uploadTypeOptions.includes(selectedFileType)) {
      setSelectedFileType("");
    }
  }, [selectedFileType, uploadTypeOptions]);

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const toggleCourseChecklist = (folderKey: string) => {
    setExpandedCourseChecklist((prev) => {
      const nextIsOpen = !prev[folderKey];
      if (nextIsOpen) {
        setExpandedFolders((folderState) => ({
          ...folderState,
          [folderKey]: true,
        }));
      }
      return {
        ...prev,
        [folderKey]: nextIsOpen,
      };
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchFiles = async () => {
      if (
        initialFiles.length > 0 &&
        fileCategories.length > 0 &&
        fileTypes.length > 0
      ) {
        setLoadingFiles(false);
        return;
      }

      setLoadingFiles(true);

      try {
        const searchParams = new URLSearchParams({
          includeMeta: "1",
          includeFaculty: "1",
          limit: "200",
        });

        if (userRole === "faculty" && user?.id) {
          searchParams.set("facultyId", user.id);
        }

        const response = await fetch(`/api/course-files?${searchParams}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error || "Failed to load files");
          return;
        }
        setFiles(data.files ?? []);
        setCategoryOptions(
          (data.fileCategories ?? [])
            .map((category: string) => String(category || "").trim())
            .filter(Boolean),
        );
        setTypeOptions(
          (data.fileTypes ?? [])
            .map((type: string) => String(type || "").trim())
            .filter(Boolean),
        );
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Load files error:", error);
        toast.error("Failed to load files");
      } finally {
        setLoadingFiles(false);
      }
    };

    void fetchFiles();

    return () => {
      controller.abort();
    };
  }, [
    fileCategories.length,
    fileTypes.length,
    initialFiles.length,
    user?.id,
    userRole,
  ]);

  useEffect(() => {
    const loadMessageNotifications = async () => {
      if (userRole !== "faculty" || !user?.id) {
        setPendingAuditorMessagesByFile({});
        return;
      }

      try {
        const searchParams = new URLSearchParams({
          facultyId: user.id,
          entityType: "course-file",
        });

        const response = await fetch(
          `/api/messages?${searchParams.toString()}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setPendingAuditorMessagesByFile({});
          return;
        }

        const messages: AuditorMessage[] = data.messages ?? [];
        const groupedThreads = messages.reduce<
          Record<string, AuditorMessage[]>
        >(
          (
            accumulator: Record<string, AuditorMessage[]>,
            message: AuditorMessage,
          ) => {
            const threadId =
              message.threadId ?? `${message.entityType}:${message.entityId}`;
            if (!accumulator[threadId]) {
              accumulator[threadId] = [];
            }
            accumulator[threadId].push(message);
            return accumulator;
          },
          {},
        );

        const threadValues: AuditorMessage[][] = Object.values(groupedThreads);
        const pendingByEntity = threadValues.reduce<Record<string, number>>(
          (accumulator, threadMessages) => {
            const latestMessage = [...threadMessages].sort((a, b) => {
              const aTime = new Date(a.createdAt ?? 0).getTime();
              const bTime = new Date(b.createdAt ?? 0).getTime();
              return aTime - bTime;
            })[threadMessages.length - 1];

            if (latestMessage?.senderRole === "auditor") {
              accumulator[latestMessage.entityId] =
                (accumulator[latestMessage.entityId] ?? 0) + 1;
            }
            return accumulator;
          },
          {},
        );

        setPendingAuditorMessagesByFile(pendingByEntity);
      } catch (error) {
        console.error("Load course file message notifications error:", error);
        setPendingAuditorMessagesByFile({});
      }
    };

    void loadMessageNotifications();

    if (typeof window !== "undefined") {
      const handler = () => {
        void loadMessageNotifications();
      };
      window.addEventListener("dashboard:data-updated", handler);
      return () => {
        window.removeEventListener("dashboard:data-updated", handler);
      };
    }
  }, [user?.id, userRole]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploadingFile) {
      return;
    }

    if (
      !selectedUploadFile ||
      !fileName ||
      !courseCode ||
      !courseName ||
      !selectedFileType ||
      !semester ||
      !selectedYear.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const normalizedBatchYear = normalizeBatchYear(selectedYear);
    if (!isValidBatchYear(normalizedBatchYear)) {
      toast.error("Batch must be in YYYY-YYYY format (for example 2022-2026)");
      return;
    }

    setIsUploadingFile(true);

    try {
      const documentUrl = await fileToDataUrl(selectedUploadFile);
      const fileSizeMb = (selectedUploadFile.size / (1024 * 1024)).toFixed(2);

      const response = await fetch("/api/course-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facultyId: user?.id,
          facultyName: user?.name ?? "",
          department: user?.department ?? "",
          fileName,
          documentUrl,
          courseCode,
          courseName,
          fileType: selectedFileType,
          uploadDate: new Date().toISOString().split("T")[0],
          semester,
          academicYear: normalizedBatchYear,
          size: `${fileSizeMb} MB`,
          status: "Pending",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }

      setFiles(data.files);
      setUploadDialogOpen(false);
      toast.success("File uploaded successfully");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }

      setSelectedFileType("");
      setCourseCode("");
      setCourseName("");
      setSemester("");
      setFileName("");
      setSelectedUploadFile(null);
      setSelectedYear(getDefaultBatchYear());
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("An error occurred during upload");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingFileId === id) {
      return;
    }

    const fileToDelete = files.find((file) => file.id === id);
    if (fileToDelete?.auditChecklistStatus === "yes") {
      toast.error(
        "This file is checklist-approved by the auditor and cannot be changed.",
      );
      return;
    }

    setDeletingFileId(id);

    try {
      const response = await fetch(`/api/course-files/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Delete failed");
        return;
      }
      setFiles(data.files);
      toast.success("File deleted successfully");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownload = (file: CourseFile) => {
    const safeName = sanitizeFileName(file.fileName, "course-file");
    if (file.documentUrl) {
      downloadFromServer(
        `/api/course-files/${encodeURIComponent(file.id)}/download`,
        safeName,
      );
      toast.success(`Downloading ${file.fileName}`);
      return;
    }

    const baseName = safeName.replace(/\.[^/.]+$/, "");
    const summaryName = `${baseName || "course-file"}-summary.txt`;
    const summary = [
      `File Name: ${file.fileName}`,
      `Course: ${file.courseCode} - ${file.courseName}`,
      `Type: ${file.fileType}`,
      `Semester: ${file.semester}`,
      `Batch: ${file.academicYear}`,
      `Uploaded: ${file.uploadDate}`,
      `Faculty: ${file.facultyName || "Unknown"}`,
      `Department: ${file.department || "Unknown"}`,
      `Status: ${file.status ?? "Unknown"}`,
    ].join("\n");
    downloadTextFile(summary, summaryName);
    toast.success(`Downloaded summary for ${file.fileName}`);
  };

  const handleView = (file: CourseFile) => {
    setSelectedFile(file);
    setIsViewOpen(true);
  };

  const facultyFiles = useMemo(() => {
    if (userRole === "faculty" && user?.id) {
      return files.filter((file) => file.facultyId === user.id);
    }
    return files;
  }, [files, user?.id, userRole]);

  const resolvedFiles = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

    return facultyFiles.filter((file) => {
      const matchesSearch =
        !normalizedSearch ||
        file.fileName.toLowerCase().includes(normalizedSearch) ||
        file.courseCode.toLowerCase().includes(normalizedSearch) ||
        file.courseName.toLowerCase().includes(normalizedSearch);
      const matchesType = filterType === "all" || file.fileType === filterType;
      const matchesStatus =
        filterStatus === "all" || file.status === filterStatus;
      const matchesYear =
        filterYear === "all" || file.academicYear === filterYear;

      return matchesSearch && matchesType && matchesStatus && matchesYear;
    });
  }, [debouncedSearchTerm, facultyFiles, filterStatus, filterType, filterYear]);

  const statuses = useMemo(
    () =>
      Array.from(new Set(facultyFiles.map((f) => f.status).filter(Boolean))),
    [facultyFiles],
  );
  const years = useMemo(() => {
    const fromFiles = facultyFiles
      .map((file) => normalizeBatchYear(file.academicYear))
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set([...fromFiles, ...batchYearOptions])).sort(
      (a, b) => b.localeCompare(a, undefined, { numeric: true }),
    );
  }, [facultyFiles]);

  // Group files by course code and academic year
  const groupedFiles = useMemo(() => {
    const groups: Record<string, CourseFile[]> = {};
    resolvedFiles.forEach((file) => {
      const groupKey = `${file.courseCode}|${file.academicYear}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(file);
    });

    const resolveFileTimestamp = (file: CourseFile) => {
      const candidateTimestamps = [
        file.updatedAt,
        file.createdAt,
        file.uploadDate,
      ];

      for (const candidate of candidateTimestamps) {
        const parsed = Date.parse(String(candidate ?? ""));
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }

      return 0;
    };

    return Object.entries(groups)
      .map(([groupKey, fileList]) => {
        const [courseCode, academicYear] = groupKey.split("|");
        const firstFile = fileList[0];
        const latestUploadMs = fileList.reduce(
          (latest, file) => Math.max(latest, resolveFileTimestamp(file)),
          0,
        );

        return {
          courseCode,
          courseName: firstFile.courseName,
          academicYear,
          semester: firstFile.semester,
          latestUploadMs,
          files: [...fileList].sort((a, b) =>
            a.fileName.localeCompare(b.fileName),
          ),
        };
      })
      .sort((a, b) => b.latestUploadMs - a.latestUploadMs);
  }, [resolvedFiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course File Management</CardTitle>
        <CardDescription>
          Upload and manage course materials, syllabi, lesson plans, and
          assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {typeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem
                    key={status || "unknown"}
                    value={status || "unknown"}
                  >
                    {status || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog
              open={uploadDialogOpen}
              onOpenChange={(nextOpen) => {
                if (!isUploadingFile) {
                  setUploadDialogOpen(nextOpen);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto" disabled={isUploadingFile}>
                  {isUploadingFile ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isUploadingFile ? "Uploading..." : "Upload File"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Course File</DialogTitle>
                  <DialogDescription>
                    Add a new course file to your repository
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      required
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setSelectedUploadFile(file);
                        setFileName(file?.name || "");
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="courseCode">Course Code</Label>
                    <Input
                      id="courseCode"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g., CS101"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g., Introduction to Computer Science"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fileType">File Type</Label>
                    <Select
                      value={selectedFileType}
                      onValueChange={(value) => setSelectedFileType(value)}
                      disabled={!courseCode.trim()}
                    >
                      <SelectTrigger id="fileType">
                        <SelectValue
                          placeholder={
                            courseCode.trim()
                              ? "Select file type"
                              : "Enter course code first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {courseCode.trim()
                        ? isTheoryCourseCode(courseCode)
                          ? "Showing theory course file types"
                          : "Showing lab course file types"
                        : "File types are based on course code — ends with \u2018T\u2019 for theory, otherwise lab"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="semester">Semester</Label>
                      <Select
                        value={semester}
                        onValueChange={(value) => setSemester(value)}
                      >
                        <SelectTrigger id="semester">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {semesterOptions.map((semesterOption) => (
                            <SelectItem
                              key={semesterOption}
                              value={semesterOption}
                            >
                              {semesterOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="academicYear">Batch</Label>
                      <Select
                        value={selectedYear}
                        onValueChange={(value) => setSelectedYear(value)}
                      >
                        <SelectTrigger id="academicYear">
                          <SelectValue placeholder="Select batch (e.g. 2022-2026)" />
                        </SelectTrigger>
                        <SelectContent>
                          {batchYearOptions.map((batchOption) => (
                            <SelectItem key={batchOption} value={batchOption}>
                              {batchOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUploadingFile}
                  >
                    {isUploadingFile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload File"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loadingFiles ? (
            <div className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : null}

          {/* Files Folder View */}
          <div className="space-y-3">
            {resolvedFiles.length === 0 ? (
              <div className="rounded-xl border bg-white py-8 text-center text-gray-500">
                No files found. Upload your first course file to get started.
              </div>
            ) : (
              groupedFiles.map((group) => {
                const folderKey = `${group.courseCode}-${group.academicYear}`;
                const isExpanded = expandedFolders[folderKey] ?? false;
                const courseChecklistReport =
                  group.files.find((file) => file.auditChecklistReport)
                    ?.auditChecklistReport ?? null;
                const isChecklistOpen =
                  expandedCourseChecklist[folderKey] ?? false;

                return (
                  <div
                    key={folderKey}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Folder Header */}
                    <div className="w-full border-l-4 border-l-blue-500 bg-slate-50/80 px-4 py-3 transition-colors hover:bg-slate-100/80 sm:px-5">
                      <button
                        onClick={() => toggleFolder(folderKey)}
                        className="flex w-full items-center gap-3 text-left"
                        type="button"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 shrink-0 text-slate-600" />
                        ) : (
                          <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
                        )}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                          <Folder className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold tracking-tight text-slate-800 sm:text-base">
                            {group.courseCode} • {group.academicYear}
                          </div>
                          <div className="truncate text-xs text-slate-500 sm:text-sm">
                            {group.courseName}
                          </div>
                        </div>

                        <div className="ml-auto flex items-center gap-2 pl-2">
                          <Badge variant="secondary" className="text-xs">
                            {group.files.length} Files
                          </Badge>
                          <Badge className="bg-emerald-100 text-xs text-emerald-800">
                            {group.files.length}
                          </Badge>
                        </div>
                      </button>

                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-3">
                        {courseChecklistReport && (
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => toggleCourseChecklist(folderKey)}
                          >
                            {isChecklistOpen
                              ? "Hide Checklist Sheet"
                              : "View Checklist Sheet"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Files in folder */}
                    {isExpanded && (
                      <div className="divide-y border-t border-slate-200">
                        {courseChecklistReport && isChecklistOpen && (
                          <div className="px-6 py-4 bg-white">
                            <div className="rounded-lg border p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Auditor Checklist Sheet
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {courseChecklistReport.courseCode}
                                    {courseChecklistReport.academicYear
                                      ? ` • ${courseChecklistReport.academicYear}`
                                      : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm max-h-52 overflow-y-auto pr-1">
                                {courseChecklistReport.checklist.map(
                                  (entry) => (
                                    <div
                                      key={`${folderKey}-${entry.id}`}
                                      className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0"
                                    >
                                      <span className="text-gray-700">
                                        {entry.label}
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          entry.status === "yes"
                                            ? "text-green-700"
                                            : entry.status === "no"
                                              ? "text-red-700"
                                              : "text-yellow-700"
                                        }`}
                                      >
                                        {entry.status === "yes"
                                          ? "Completed"
                                          : entry.status === "no"
                                            ? "Needs Update"
                                            : "Pending"}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {group.files.map((file) => {
                          const isChecklistLocked =
                            file.auditChecklistStatus === "yes";

                          return (
                            <div
                              key={file.id}
                              className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 gap-3"
                            >
                              <div className="flex-1 flex items-center gap-3">
                                {/* Status icon */}
                                <CheckCircle2
                                  className={`h-5 w-5 shrink-0 ${
                                    file.status === "Approved"
                                      ? "text-green-600"
                                      : file.status === "Rejected"
                                        ? "text-red-600"
                                        : "text-yellow-600"
                                  }`}
                                />
                                {/* File info */}
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {file.fileName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <Badge
                                      variant="outline"
                                      className="text-xs mr-2"
                                    >
                                      {file.fileType}
                                    </Badge>
                                    {isChecklistLocked && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs mr-2 border-green-300 text-green-700"
                                      >
                                        Checklist Yes - Locked
                                      </Badge>
                                    )}
                                    <span>
                                      {file.uploadDate} • {group.semester}{" "}
                                      {file.academicYear}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Status and actions */}
                              <div className="flex items-center gap-3 shrink-0">
                                {file.status && (
                                  <Badge
                                    className={`text-xs ${
                                      file.status === "Approved"
                                        ? "bg-green-100 text-green-800"
                                        : file.status === "Rejected"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {file.status}
                                  </Badge>
                                )}
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(file)}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(file)}
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4 text-gray-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(file.id)}
                                    disabled={
                                      isChecklistLocked ||
                                      deletingFileId === file.id
                                    }
                                    title={
                                      isChecklistLocked
                                        ? "Checklist-approved file cannot be deleted"
                                        : "Delete File"
                                    }
                                  >
                                    {deletingFileId === file.id ? (
                                      <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl">{resolvedFiles.length}</div>
                <p className="text-sm text-gray-500">Total Files</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl">{fileTypes.length}</div>
                <p className="text-sm text-gray-500">File Types</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl">{years.length}</div>
                <p className="text-sm text-gray-500">Batches</p>
              </CardContent>
            </Card>
          </div>

          {/* View File Details Dialog */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent
              className="max-w-3xl overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 4rem)" }}
            >
              <DialogHeader>
                <DialogTitle>File Details</DialogTitle>
                <DialogDescription>
                  {selectedFile && (
                    <span className="inline-flex items-center gap-2 mt-2">
                      <FileText className="h-4 w-4" />
                      {selectedFile.fileName}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              {selectedFile && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Course Code</p>
                      <p>{selectedFile.courseCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Batch</p>
                      <p>{selectedFile.academicYear}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Course Name</p>
                      <p>{selectedFile.courseName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Semester</p>
                      <p>{selectedFile.semester}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">File Type</p>
                      <p>{selectedFile.fileType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Upload Date</p>
                      <p>{selectedFile.uploadDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">File Size</p>
                      <p>{selectedFile.size}</p>
                    </div>
                  </div>

                  {/* Auditor–Faculty Chat */}
                  <EntityMessagesPanel
                    facultyId={user?.id}
                    entityType="course-file"
                    entityId={selectedFile.id}
                    itemType="file"
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleDownload(selectedFile)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsViewOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
