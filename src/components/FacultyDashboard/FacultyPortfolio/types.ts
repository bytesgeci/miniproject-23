export interface FacultyMember {
  id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  courses: string[];
  specialization: string;
  experience: string;
}

export interface CourseFile {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  courseName: string;
  semester: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
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

export interface FacultyPortfolioProps {
  faculty: FacultyMember;
  onBack: () => void;
}
