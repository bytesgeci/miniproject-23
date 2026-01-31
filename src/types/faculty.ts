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

export interface DashboardStats {
  totalFiles: number;
  totalReports: number;
  pendingReports: number;
  totalParticipants: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  action: string;
  item: string;
  time: string;
}
