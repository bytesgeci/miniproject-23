import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Eye, Trash2, Plus, Search, FileCheck, Upload, Image as ImageIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllFacultyReportsView } from "./AllFacultyReportsView";
import { EventReportBlogViewer } from "./EventReportBlogViewer";
import { mockEventReports, communities } from "./mockData";
import { EventReport } from "./types";

export function EventReportManager() {
  const [reports, setReports] = useState<EventReport[]>(mockEventReports);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCommunity, setFilterCommunity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

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
    galleryFiles: [] as File[]
  });

  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

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
    
    files.forEach(file => {
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

    setNewReport({ ...newReport, galleryFiles: [...newReport.galleryFiles, ...validFiles] });
  };

  const removeGalleryImage = (index: number) => {
    const newGalleryFiles = newReport.galleryFiles.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setNewReport({ ...newReport, galleryFiles: newGalleryFiles });
    setGalleryPreviews(newPreviews);
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReport.thumbnailFile) {
      toast.error("Please upload a thumbnail image");
      return;
    }

    const mockReport: EventReport = {
      id: Date.now().toString(),
      eventName: newReport.eventName,
      community: newReport.community,
      eventDate: newReport.eventDate,
      description: newReport.description,
      location: newReport.location || undefined,
      participants: newReport.participants ? parseInt(newReport.participants) : undefined,
      duration: newReport.duration || undefined,
      objectives: newReport.objectives || undefined,
      outcomes: newReport.outcomes || undefined,
      thumbnailUrl: thumbnailPreview || undefined,
      galleryImages: galleryPreviews.length > 0 ? galleryPreviews : undefined,
      status: "Draft",
      facultyCoordinator: "Dr. Sarah Johnson"
    };

    setReports([mockReport, ...reports]);
    setIsCreateOpen(false);
    toast.success("Event report created successfully");
    
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
      galleryFiles: []
    });
    setThumbnailPreview(null);
    setGalleryPreviews([]);
  };

  const handleSubmitReport = (id: string) => {
    setReports(reports.map(r => 
      r.id === id 
        ? { ...r, status: "Submitted" as const, submittedDate: new Date().toISOString().split('T')[0] }
        : r
    ));
    toast.success("Report submitted for review");
  };

  const handleDelete = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    toast.success("Report deleted successfully");
  };

  const handleView = (report: EventReport) => {
    setSelectedReport(report);
    setIsViewOpen(true);
  };

  const handleDownload = (report: EventReport) => {
    toast.success(`Downloading ${report.eventName} report`);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.community.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesCommunity = filterCommunity === "all" || report.community === filterCommunity;
    
    return matchesSearch && matchesStatus && matchesCommunity;
  });

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Submitted": return "bg-blue-100 text-blue-800";
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isViewOpen && selectedReport) {
    return (
      <EventReportBlogViewer
        report={selectedReport}
        onBack={() => setIsViewOpen(false)}
        onDownload={handleDownload}
        onRespondToAdminReview={(response) => {
          const updated = reports.map(r => 
            r.id === selectedReport.id 
              ? { ...r, facultyResponse: response, responseDate: new Date().toISOString().split('T')[0] }
              : r
          );
          setReports(updated);
          setSelectedReport({...selectedReport, facultyResponse: response, responseDate: new Date().toISOString().split('T')[0]});
          toast.success("Response submitted successfully");
        }}
        currentUser="Dr. Sarah Johnson"
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
        <Tabs defaultValue="my-reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
            <TabsTrigger value="all-reports">All Faculty Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="my-reports" className="space-y-4 mt-4">
            {/* Search and Filter Bar */}
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
                  {communities.map(community => (
                    <SelectItem key={community} value={community}>{community}</SelectItem>
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
                      Document a community engagement event with details and thumbnail
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
                                setNewReport({ ...newReport, thumbnailFile: null });
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
                        onChange={(e) => setNewReport({...newReport, eventName: e.target.value})}
                        placeholder="e.g., Community Health Workshop"
                        required
                      />
                    </div>

                    {/* Community Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="community">Community *</Label>
                      <Select
                        value={newReport.community}
                        onValueChange={(value) => setNewReport({...newReport, community: value})}
                      >
                        <SelectTrigger id="community">
                          <SelectValue placeholder="Select community type" />
                        </SelectTrigger>
                        <SelectContent>
                          {communities.map(community => (
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
                        onChange={(e) => setNewReport({...newReport, eventDate: e.target.value})}
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
                          onChange={(e) => setNewReport({...newReport, location: e.target.value})}
                          placeholder="e.g., Community Center"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="participants">Number of Participants</Label>
                        <Input
                          id="participants"
                          type="number"
                          min="0"
                          value={newReport.participants}
                          onChange={(e) => setNewReport({...newReport, participants: e.target.value})}
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
                        onChange={(e) => setNewReport({...newReport, duration: e.target.value})}
                        placeholder="e.g., 3 hours"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Event Description *</Label>
                      <Textarea
                        id="description"
                        value={newReport.description}
                        onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                        placeholder="Provide a detailed description of the event, its activities, and impact..."
                        rows={4}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Provide comprehensive details about the event, activities conducted, and community impact.
                      </p>
                    </div>

                    {/* Objectives */}
                    <div className="space-y-2">
                      <Label htmlFor="objectives">Objectives</Label>
                      <Textarea
                        id="objectives"
                        value={newReport.objectives}
                        onChange={(e) => setNewReport({...newReport, objectives: e.target.value})}
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
                        onChange={(e) => setNewReport({...newReport, outcomes: e.target.value})}
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
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No reports found. Create your first event report to get started.
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
                              <div className="font-medium">{report.eventName}</div>
                              {report.location && (
                                <div className="text-sm text-gray-500">{report.location}</div>
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
          </TabsContent>

          <TabsContent value="all-reports" className="space-y-4 mt-4">
            <AllFacultyReportsView reports={reports} onReportUpdate={(updatedReport) => {
              const updated = reports.map(r => r.id === updatedReport.id ? updatedReport : r);
              setReports(updated);
            }} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
