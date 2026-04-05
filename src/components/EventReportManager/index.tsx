"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Calendar,
  Eye,
  Trash2,
  Plus,
  Search,
  FileCheck,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EventReportBlogViewer } from "./EventReportBlogViewer";
import { EventReport } from "./types";
import { useAuth } from "@/context/AuthContext";

interface EventReportManagerProps {
  initialReports?: EventReport[];
  communities?: string[];
}

interface AuditorMessage {
  id: string;
  entityType: "course-file" | "event-report" | string;
  entityId: string;
  threadId?: string;
  senderRole?: "auditor" | "faculty" | string;
  createdAt?: string;
}

const DEFAULT_COMMUNITY_OPTIONS = [
  "Community Outreach",
  "Health Awareness",
  "Education Support",
  "Environmental Initiative",
  "Skill Development",
  "Other",
];

function normalizeCommunityOptions(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export function EventReportManager({
  initialReports = [],
  communities = [],
}: EventReportManagerProps) {
  const [reports, setReports] = useState<EventReport[]>(initialReports);
  const [communityOptions, setCommunityOptions] = useState<string[]>(
    normalizeCommunityOptions([
      ...communities,
      ...initialReports.map((report) => report.community),
    ]),
  );
  const { user, userRole } = useAuth();
  const displayName = user?.name ?? "";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCommunity, setFilterCommunity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(
    null,
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [pendingAuditorMessagesByReport, setPendingAuditorMessagesByReport] =
    useState<Record<string, number>>({});

  // Form state for new report
  const [newReport, setNewReport] = useState({
    eventName: "",
    community: "",
    eventDate: "",
    description: "",
    location: "",
    participants: "",
    duration: "",
    objectives: "",
    outcomes: "",
    thumbnailFile: null as File | null,
    galleryFiles: [] as File[],
  });

  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const discoveredCommunityOptions = useMemo(
    () =>
      normalizeCommunityOptions([
        ...communityOptions,
        ...reports.map((report) => report.community),
      ]),
    [communityOptions, reports],
  );

  const createCommunityOptions = useMemo(
    () =>
      normalizeCommunityOptions([
        ...DEFAULT_COMMUNITY_OPTIONS,
        ...discoveredCommunityOptions,
      ]),
    [discoveredCommunityOptions],
  );

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/event-reports");
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error || "Failed to load reports");
          return;
        }
        const nextReports = data.reports ?? [];
        setReports(nextReports);
        setCommunityOptions(
          normalizeCommunityOptions([
            ...(data.communities ?? []),
            ...nextReports.map((report: EventReport) => report.community),
          ]),
        );
      } catch (error) {
        console.error("Load reports error:", error);
        toast.error("Failed to load reports");
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    const loadMessageNotifications = async () => {
      if (userRole !== "faculty" || !user?.id) {
        setPendingAuditorMessagesByReport({});
        return;
      }

      try {
        const searchParams = new URLSearchParams({
          facultyId: user.id,
          entityType: "event-report",
        });

        const response = await fetch(
          `/api/messages?${searchParams.toString()}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setPendingAuditorMessagesByReport({});
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

        setPendingAuditorMessagesByReport(pendingByEntity);
      } catch (error) {
        console.error("Load event report message notifications error:", error);
        setPendingAuditorMessagesByReport({});
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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Thumbnail size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setNewReport({ ...newReport, thumbnailFile: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + newReport.galleryFiles.length > 10) {
      toast.error("Maximum 10 gallery images allowed");
      return;
    }

    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          setGalleryPreviews([...galleryPreviews, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setNewReport({
      ...newReport,
      galleryFiles: [...newReport.galleryFiles, ...validFiles],
    });
  };

  const removeGalleryImage = (index: number) => {
    const newGalleryFiles = newReport.galleryFiles.filter(
      (_, i) => i !== index,
    );
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setNewReport({ ...newReport, galleryFiles: newGalleryFiles });
    setGalleryPreviews(newPreviews);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReport.thumbnailFile) {
      toast.error("Please upload a thumbnail image");
      return;
    }

    try {
      const response = await fetch("/api/event-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facultyId: user?.id,
          facultyCoordinator: displayName,
          department: user?.department,
          eventName: newReport.eventName,
          community: newReport.community,
          eventDate: newReport.eventDate,
          description: newReport.description,
          location: newReport.location || undefined,
          participants: newReport.participants
            ? parseInt(newReport.participants)
            : undefined,
          duration: newReport.duration || undefined,
          objectives: newReport.objectives || undefined,
          outcomes: newReport.outcomes || undefined,
          thumbnailUrl: thumbnailPreview || undefined,
          galleryImages:
            galleryPreviews.length > 0 ? galleryPreviews : undefined,
          status: "Draft",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Report creation failed");
        return;
      }

      setReports(data.reports);
      setIsCreateOpen(false);
      toast.success("Event report created successfully");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }

      setNewReport({
        eventName: "",
        community: "",
        eventDate: "",
        description: "",
        location: "",
        participants: "",
        duration: "",
        objectives: "",
        outcomes: "",
        thumbnailFile: null,
        galleryFiles: [],
      });
      setThumbnailPreview(null);
      setGalleryPreviews([]);
    } catch (error) {
      console.error("Report create error:", error);
      toast.error("An error occurred during creation");
    }
  };

  const handleSubmitReport = async (id: string) => {
    try {
      const response = await fetch(`/api/event-reports/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Submitted",
          submittedDate: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Submit failed");
        return;
      }
      setReports(data.reports);
      toast.success("Report submitted for review");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An error occurred while submitting");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/event-reports/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Delete failed");
        return;
      }
      setReports(data.reports);
      toast.success("Report deleted successfully");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    }
  };

  const handleView = (report: EventReport) => {
    setSelectedReport(report);
    setIsViewOpen(true);
  };

  const visibleReports = useMemo(() => {
    if (userRole === "faculty" && user?.id) {
      return reports.filter((report) => report.facultyId === user.id);
    }
    return reports;
  }, [reports, user?.id, userRole]);

  const filteredReports = visibleReports.filter((report) => {
    const matchesSearch =
      report.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.community.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || report.status === filterStatus;
    const matchesCommunity =
      filterCommunity === "all" || report.community === filterCommunity;

    return matchesSearch && matchesStatus && matchesCommunity;
  });

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Submitted":
        return "bg-blue-100 text-blue-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isViewOpen && selectedReport) {
    return (
      <EventReportBlogViewer
        report={selectedReport}
        onBack={() => setIsViewOpen(false)}
        onRespondToAdminReview={async (responseText) => {
          try {
            const apiResponse = await fetch(
              `/api/event-reports/${selectedReport.id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  facultyResponse: responseText,
                }),
              },
            );
            const data = await apiResponse.json();
            if (!apiResponse.ok) {
              toast.error(data.error || "Response failed");
              return;
            }
            setReports(data.reports);
            const updated = data.reports.find(
              (report: EventReport) => report.id === selectedReport.id,
            );
            if (updated) {
              setSelectedReport(updated);
            }
            toast.success("Response submitted successfully");
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("dashboard:data-updated"));
            }
          } catch (error) {
            console.error("Response error:", error);
            toast.error("An error occurred while responding");
          }
        }}
        currentUser={displayName}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Event Reports</CardTitle>
        <CardDescription>
          Create and manage reports for community engagement and outreach events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCommunity} onValueChange={setFilterCommunity}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by Community" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Communities</SelectItem>
                {discoveredCommunityOptions.map((community) => (
                  <SelectItem key={community} value={community}>
                    {community}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Event Report</DialogTitle>
                  <DialogDescription>
                    Document a community engagement event with details and
                    thumbnail
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateReport} className="space-y-4">
                  {/* Thumbnail Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Event Thumbnail *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                      {thumbnailPreview ? (
                        <div className="relative">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setNewReport({
                                ...newReport,
                                thumbnailFile: null,
                              });
                              setThumbnailPreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="thumbnail"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 mb-1">
                            Click to upload thumbnail image
                          </span>
                          <span className="text-xs text-gray-500">
                            PNG, JPG up to 5MB
                          </span>
                          <Input
                            id="thumbnail"
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name *</Label>
                    <Input
                      id="eventName"
                      value={newReport.eventName}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          eventName: e.target.value,
                        })
                      }
                      placeholder="e.g., Community Health Workshop"
                      required
                    />
                  </div>

                  {/* Community Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="community">Community *</Label>
                    <Select
                      value={newReport.community}
                      onValueChange={(value) =>
                        setNewReport({ ...newReport, community: value })
                      }
                    >
                      <SelectTrigger id="community">
                        <SelectValue placeholder="Select community type" />
                      </SelectTrigger>
                      <SelectContent>
                        {createCommunityOptions.map((community) => (
                          <SelectItem key={community} value={community}>
                            {community}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Event Date */}
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={newReport.eventDate}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          eventDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Location and Participants */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newReport.location}
                        onChange={(e) =>
                          setNewReport({
                            ...newReport,
                            location: e.target.value,
                          })
                        }
                        placeholder="e.g., Community Center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="participants">
                        Number of Participants
                      </Label>
                      <Input
                        id="participants"
                        type="number"
                        min="0"
                        value={newReport.participants}
                        onChange={(e) =>
                          setNewReport({
                            ...newReport,
                            participants: e.target.value,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={newReport.duration}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          duration: e.target.value,
                        })
                      }
                      placeholder="e.g., 3 hours"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Event Description *</Label>
                    <Textarea
                      id="description"
                      value={newReport.description}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          description: e.target.value,
                        })
                      }
                      placeholder="Provide a detailed description of the event, its activities, and impact..."
                      rows={4}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Provide comprehensive details about the event, activities
                      conducted, and community impact.
                    </p>
                  </div>

                  {/* Objectives */}
                  <div className="space-y-2">
                    <Label htmlFor="objectives">Objectives</Label>
                    <Textarea
                      id="objectives"
                      value={newReport.objectives}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          objectives: e.target.value,
                        })
                      }
                      placeholder="What were the goals and objectives of this event?"
                      rows={3}
                    />
                  </div>

                  {/* Outcomes */}
                  <div className="space-y-2">
                    <Label htmlFor="outcomes">Outcomes & Impact</Label>
                    <Textarea
                      id="outcomes"
                      value={newReport.outcomes}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          outcomes: e.target.value,
                        })
                      }
                      placeholder="What were the results and impact of the event?"
                      rows={3}
                    />
                  </div>

                  {/* Gallery Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="gallery">Gallery Images (optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                      {galleryPreviews.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                          {galleryPreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Gallery preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => removeGalleryImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <label
                          htmlFor="gallery"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 mb-1">
                            Click to upload gallery images
                          </span>
                          <span className="text-xs text-gray-500">
                            PNG, JPG up to 5MB each
                          </span>
                          <Input
                            id="gallery"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Reports Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Community</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-8"
                    >
                      No reports found. Create your first event report to get
                      started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {report.thumbnailUrl && (
                            <img
                              src={report.thumbnailUrl}
                              alt={report.eventName}
                              className="h-12 w-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">
                                {report.eventName}
                              </div>
                              {(pendingAuditorMessagesByReport[report.id] ??
                                0) > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                                  New message
                                  {(pendingAuditorMessagesByReport[report.id] ??
                                    0) > 1
                                    ? ` (${pendingAuditorMessagesByReport[report.id]})`
                                    : ""}
                                </span>
                              )}
                            </div>
                            {report.location && (
                              <div className="text-sm text-gray-500">
                                {report.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.community}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(report.eventDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {report.status === "Draft" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSubmitReport(report.id)}
                              >
                                <FileCheck className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(report.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
