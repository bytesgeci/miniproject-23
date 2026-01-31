export interface PeerReview {
  id: string;
  reviewerName: string;
  reviewDate: string;
  comment: string;
  facultyResponse?: string;
  responseDate?: string;
  reviewerAvatar?: string;
}

export interface CourseFile {
  id: string;
  fileName: string;
  courseCode: string;
  courseName: string;
  fileType: string;
  uploadDate: string;
  semester: string;
  academicYear: string;
  size: string;
  status?: "Pending" | "Approved" | "Rejected";
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  facultyResponse?: string;
  responseDate?: string;
  facultyName: string;
  department: string;
  peerReviews?: PeerReview[];
}

export interface DocumentViewerInterfaceProps {
  file: CourseFile;
  onBack: () => void;
  onDownload: (file: CourseFile) => void;
  onPeerReview: (review: string) => void;
  onRespondToReview: (response: string) => void;
  currentUser: string;
}
