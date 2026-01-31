import { DashboardStats } from "./types";

export const mockStats: DashboardStats = {
  totalFaculty: 6,
  totalFiles: 45,
  totalReports: 28,
  approvedFiles: 32,
  approvedReports: 20,
  pendingFiles: 10,
  pendingReports: 6,
  rejectedFiles: 3,
  rejectedReports: 2,
  completionRate: 78
};

export const mockFacultyMembers = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    department: "Computer Science",
    totalFiles: 8,
    totalReports: 5,
    approvedFiles: 6,
    approvedReports: 4,
    pendingFiles: 2,
    pendingReports: 1,
    rejectedFiles: 0,
    rejectedReports: 0
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    department: "Mathematics",
    totalFiles: 7,
    totalReports: 4,
    approvedFiles: 5,
    approvedReports: 3,
    pendingFiles: 1,
    pendingReports: 1,
    rejectedFiles: 1,
    rejectedReports: 0
  }
];

export const mockRecentReviews = [
  { faculty: "Dr. Sarah Johnson", item: "CS101 Syllabus", action: "Approved", time: "2 hours ago" }
];
