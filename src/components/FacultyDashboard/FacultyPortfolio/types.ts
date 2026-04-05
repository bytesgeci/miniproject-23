export interface FacultyMember {
  id: string;
  username?: string;
  name: string;
  department: string;
  role: string;
  roles?: string[];
  isStaffAdvisor?: boolean;
  email: string;
  phone: string;
  courses: string[];
  specialization: string;
  experience: string;
  profileImageUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
}

export interface Student {
  id: string;
  advisorId?: string;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  semester: string;
  batchYear?: string;
  cgpa: number;
  attendance: number;
  careerInterest: string;
  skillsAcquired: string[];
  placementStatus: "Placed" | "In Process" | "Not Started";
  companyName?: string;
  activityPoints: number;
  activities: Array<{
    id: string;
    name: string;
    community: string;
    points: number;
    date: string;
  }>;
}

export type AuditChecklistStatus = "yes" | "no" | "pending";

export interface CourseAuditChecklistReportItem {
  id: string;
  label: string;
  status: AuditChecklistStatus;
}

export interface CourseAuditChecklistReport {
  courseCode: string;
  courseName?: string;
  academicYear?: string;
  checklist: CourseAuditChecklistReportItem[];
  remarks?: string;
  decision?: "approve" | "reject";
  updatedBy?: string;
  updatedAt?: string;
  isFinalized?: boolean;
}

export interface CourseFile {
  id: string;
  facultyId?: string;
  fileName: string;
  documentUrl?: string;
  courseCode: string;
  courseName: string;
  fileType: string;
  uploadDate: string;
  semester: string;
  academicYear: string;
  size: string;
  status?: "Pending" | "Approved" | "Rejected" | "Draft" | "Submitted";
  adminRemarks?: string;
  auditorRemarks?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  facultyResponse?: string;
  responseDate?: string;
  auditChecklistStatus?: AuditChecklistStatus;
  auditChecklistUpdatedAt?: string;
  auditChecklistFinalized?: boolean;
  auditChecklistReport?: CourseAuditChecklistReport;
  facultyName: string;
  department: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventReport {
  id: string;
  facultyId?: string;
  facultyCoordinator?: string;
  community?: string;
  department?: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  location: string;
  participants: number;
  duration: string;
  description: string;
  objectives: string;
  outcomes: string;
  thumbnailUrl?: string;
  galleryImages?: string[];
  auditorRemarks?: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
}

export interface FacultyPortfolioProps {
  faculty: FacultyMember;
  onBack: () => void;
}
