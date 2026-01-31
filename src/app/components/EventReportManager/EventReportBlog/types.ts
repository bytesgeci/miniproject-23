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
  thumbnail: string;
  gallery: string[];
  facultyName: string;
  department: string;
}

export interface EventReportBlogProps {
  report: EventReport;
  onBack: () => void;
}
