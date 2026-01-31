export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  semester: string;
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

export interface FacultyStatus {
  id: string;
  name: string;
  department: string;
  filesUploaded: number;
  filesRequired: number;
  reportsUploaded: number;
  reportsRequired: number;
  lastUpdate: string;
  status: "Complete" | "Pending" | "Delayed";
}

export interface DashboardStats {
  totalStudents: number;
  batchYear: string;
  placedStudents: number;
  inProcess: number;
  averageCGPA: number;
  averageAttendance: number;
  totalFaculty: number;
  approvedFiles: number;
  approvedReports: number;
}

export interface CareerStats {
  totalInternships: number;
  activeInternships: number;
  completedProjects: number;
  skillWorkshops: number;
  campusInterviews: number;
}

export interface Activity {
  id: string;
  name: string;
  community: string;
  points: number;
  date: string;
}
