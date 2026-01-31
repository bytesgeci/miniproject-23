export interface CourseFile {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  courseName: string;
  semester: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  documentUrl?: string;
}

export interface EventReport {
  id: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  location: string;
  participants: number;
  duration: string;
  description: string;
  objectives: string;
  outcomes: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
}

export interface AuditReviewInterfaceProps {
  type: "file" | "report";
  item: CourseFile | EventReport;
  facultyName: string;
  onBack: () => void;
}

export interface ChecklistItem {
  id: string;
  label: string;
}
