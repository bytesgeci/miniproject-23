import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Calendar, Download, Search, Filter, Eye, MessageSquare, Reply, User } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import { PeerReviewDialog } from "../shared/dialogs/PeerReviewDialog";
import { ResponseDialog } from "../shared/dialogs/ResponseDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { EventReport, PeerReview } from "./types";

const CURRENT_USER = "Dr. Sarah Johnson";

interface AllFacultyReportsViewProps {
  reports: EventReport[];
  onReportUpdate?: (updatedReport: EventReport) => void;
}

export function AllFacultyReportsView({ reports, onReportUpdate }: AllFacultyReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(null);
  const [isPeerReviewOpen, setIsPeerReviewOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PeerReview | null>(null);

  const handleView = (report: EventReport) => {
    setSelectedReport(report);
    setIsViewOpen(true);
  };

  const handlePeerReview = (review: string) => {
    if (!selectedReport) return;

    const newReview: PeerReview = {
      id: `pr${Date.now()}`,
      reviewerName: CURRENT_USER,
      reviewDate: new Date().toISOString().split('T')[0],
      comment: review
    };

    const updatedReport = {
      ...selectedReport,
      peerReviews: [...(selectedReport.peerReviews || []), newReview]
    };
    
    setSelectedReport(updatedReport);
    onReportUpdate?.(updatedReport);
    setIsPeerReviewOpen(false);
  };

  const handleRespondToReview = (response: string) => {
    if (!selectedReport || !selectedReview) return;

    const updatedReport = {
      ...selectedReport,
      peerReviews: selectedReport.peerReviews?.map(pr =>
        pr.id === selectedReview.id
          ? { ...pr, facultyResponse: response, responseDate: new Date().toISOString().split('T')[0] }
          : pr
      )
    };

    setSelectedReport(updatedReport);
    onReportUpdate?.(updatedReport);
    setSelectedReview(null);
    setIsResponseOpen(false);
  };

  const handleDownload = (report: EventReport) => {
    toast.success(`Downloading ${report.eventName} report`);
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Submitted":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.facultyCoordinator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.eventType && report.eventType.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDepartment = filterDepartment === "all" || report.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesYear = filterYear === "all" || new Date(report.eventDate).getFullYear().toString() === filterYear;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesYear;
  });

  const uniqueDepartments = Array.from(new Set(reports.map(r => r.department).filter(Boolean) as string[]));
  const uniqueYears = Array.from(new Set(reports.map(r => new Date(r.eventDate).getFullYear().toString()))).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by event name, faculty, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {uniqueYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reports Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Coordinator</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Peer Reviews</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No event reports found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <div>
                          <div>{report.eventName}</div>
                          {report.location && (
                            <div className="text-sm text-gray-500">{report.location}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{report.facultyCoordinator}</div>
                        {report.department && (
                          <div className="text-sm text-gray-500">{report.department}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{report.eventDate}</TableCell>
                    <TableCell>
                      {report.eventType && (
                        <Badge variant="secondary">{report.eventType}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{report.peerReviews?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(report)}
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* View Report Details Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Event Report Details & Peer Review</DialogTitle>
              <DialogDescription>
                {selectedReport && (
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {selectedReport.eventName}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                {/* Report Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Coordinator</p>
                    <p>{selectedReport.facultyCoordinator}</p>
                  </div>
                  {selectedReport.department && (
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p>{selectedReport.department}</p>
                    </div>
                  )}
                  {selectedReport.eventType && (
                    <div>
                      <p className="text-sm text-gray-500">Event Type</p>
                      <p>{selectedReport.eventType}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Event Date</p>
                    <p>{selectedReport.eventDate}</p>
                  </div>
                  {selectedReport.location && (
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>{selectedReport.location}</p>
                    </div>
                  )}
                  {selectedReport.participants && (
                    <div>
                      <p className="text-sm text-gray-500">Participants</p>
                      <p>{selectedReport.participants}</p>
                    </div>
                  )}
                  {selectedReport.duration && (
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p>{selectedReport.duration}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={getStatusColor(selectedReport.status)}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-3">
                  {selectedReport.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-sm">{selectedReport.description}</p>
                    </div>
                  )}
                  {selectedReport.objectives && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Objectives</p>
                      <p className="text-sm">{selectedReport.objectives}</p>
                    </div>
                  )}
                  {selectedReport.outcomes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Outcomes</p>
                      <p className="text-sm">{selectedReport.outcomes}</p>
                    </div>
                  )}
                </div>

                {/* Admin Review */}
                {selectedReport.adminRemarks && (
                  <div className="border-t pt-4">
                    <h4 className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                      Admin Review
                    </h4>
                    <Alert className={
                      selectedReport.status === "Approved" 
                        ? "border-green-200 bg-green-50" 
                        : selectedReport.status === "Rejected"
                        ? "border-red-200 bg-red-50"
                        : "border-blue-200 bg-blue-50"
                    }>
                      <AlertDescription>
                        <p className="text-sm mb-3">{selectedReport.adminRemarks}</p>
                        {selectedReport.reviewedBy && (
                          <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                            <p>Reviewed by: {selectedReport.reviewedBy}</p>
                            {selectedReport.reviewedDate && (
                              <p>Date: {selectedReport.reviewedDate}</p>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Peer Reviews Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                      Peer Reviews ({selectedReport.peerReviews?.length || 0})
                    </h4>
                    <Button
                      size="sm"
                      onClick={() => setIsPeerReviewOpen(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Review
                    </Button>
                  </div>

                  {selectedReport.peerReviews && selectedReport.peerReviews.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full border rounded-lg">
                      {selectedReport.peerReviews.map((review) => (
                        <AccordionItem key={review.id} value={review.id}>
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <User className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="text-left">
                                  <p className="font-medium">{review.reviewerName}</p>
                                  <p className="text-xs text-gray-500">{review.reviewDate}</p>
                                </div>
                              </div>
                              {review.facultyResponse && (
                                <Badge className="bg-blue-100 text-blue-800 mr-2">
                                  Responded
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4">
                            <div className="space-y-3">
                              {/* Review Comment */}
                              <Alert className="border-purple-200 bg-purple-50">
                                <AlertDescription>
                                  <p className="text-xs text-purple-800 mb-2">Review:</p>
                                  <p className="text-sm">{review.comment}</p>
                                </AlertDescription>
                              </Alert>

                              {/* Faculty Response to Peer Review */}
                              {review.facultyResponse ? (
                                <Alert className="border-blue-200 bg-blue-50">
                                  <AlertDescription>
                                    <p className="text-xs text-blue-800 mb-2">Response from {selectedReport.facultyCoordinator}:</p>
                                    <p className="text-sm">{review.facultyResponse}</p>
                                    <p className="text-xs text-gray-500 mt-2">{review.responseDate}</p>
                                  </AlertDescription>
                                </Alert>
                              ) : (
                                <div className="space-y-2">
                                  {review.reviewerName === CURRENT_USER ? (
                                    <Alert>
                                      <AlertDescription className="text-xs text-gray-500 italic">
                                        Awaiting response from {selectedReport.facultyCoordinator}...
                                      </AlertDescription>
                                    </Alert>
                                  ) : selectedReport.facultyCoordinator === CURRENT_USER ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedReview(review);
                                        setIsResponseOpen(true);
                                      }}
                                      className="w-full"
                                    >
                                      <Reply className="h-4 w-4 mr-2" />
                                      Respond to Review
                                    </Button>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <Alert>
                      <AlertDescription className="text-sm text-gray-500">
                        No peer reviews yet. Be the first to provide feedback!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Peer Review Dialog */}
        <PeerReviewDialog
          open={isPeerReviewOpen}
          onOpenChange={setIsPeerReviewOpen}
          onSubmit={handlePeerReview}
          itemType="report"
          itemName={selectedReport?.eventName || ""}
        />

        {/* Response to Peer Review Dialog */}
        <ResponseDialog
          open={isResponseOpen}
          onOpenChange={(open) => {
            setIsResponseOpen(open);
            if (!open) setSelectedReview(null);
          }}
          onSubmit={handleRespondToReview}
          itemType="report"
        />
      </CardContent>
    </Card>
  );
}
