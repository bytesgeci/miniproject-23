export interface PeerReview {
  id: string;
  reviewerName: string;
  reviewDate: string;
  comment: string;
  facultyResponse?: string;
  responseDate?: string;
}

export interface EventReport {
  id: string;
  eventName: string;
  community: string;
  eventDate: string;
  description: string;
  thumbnailUrl?: string;
  location?: string;
  participants?: number;
  duration?: string;
  objectives?: string;
  outcomes?: string;
  galleryImages?: string[];
  status?: "Draft" | "Submitted" | "Approved" | "Rejected";
  submittedDate?: string;
  facultyCoordinator: string;
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  facultyResponse?: string;
  responseDate?: string;
  peerReviews?: PeerReview[];
}

export interface EventReportBlogViewerProps {
  report: EventReport;
  onBack: () => void;
  onDownload: (report: EventReport) => void;
  onRespondToAdminReview: (response: string) => void;
  currentUser: string;
}
