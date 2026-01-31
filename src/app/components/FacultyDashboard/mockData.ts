import { FacultyMember, DashboardStats } from "../../types/faculty";

export const mockStats: DashboardStats = {
  totalFiles: 23,
  totalReports: 8,
  pendingReports: 2,
  totalParticipants: 245,
  recentActivity: [
    { action: "Uploaded", item: "CS101_Syllabus_Fall2024.pdf", time: "2 hours ago" }
  ]
};

export const mockFacultyMembers: FacultyMember[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    department: "Computer Science",
    role: "Associate Professor",
    email: "sarah.johnson@college.edu",
    phone: "+1 (555) 123-4567",
    courses: ["CS101 - Intro to Programming", "CS201 - Data Structures", "CS301 - Algorithms"],
    specialization: "Artificial Intelligence & Machine Learning",
    experience: "12 years"
  }
];
