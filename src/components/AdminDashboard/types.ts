import type { UserRole } from "@/lib/roles";

export type AdminUserStatus =
  | "pending"
  | "active"
  | "inactive"
  | "suspended"
  | "rejected";

export interface AdminUserPermissions {
  upload_files: boolean;
  create_reports: boolean;
  view_peer_work: boolean;
  audit_submissions: boolean;
  manage_users: boolean;
  view_analytics: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  designation?: string;
  role: UserRole;
  roles?: UserRole[];
  status: AdminUserStatus;
  lastActive?: string;
  joinedDate?: string;
  courseFilesCount: number;
  eventReportsCount: number;
  completionRate: number;
  weeklyActivity: number[];
  permissions: AdminUserPermissions;
}

export interface NotificationData {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}
