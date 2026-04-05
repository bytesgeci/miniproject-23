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
