"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminHeader } from "./AdminHeader";
import { AdminStats } from "./AdminStats";
import { UsersTable } from "./UsersTable";
import { EditUserDialog } from "./EditUserDialog";
import type { AdminUser, AdminUserStatus, NotificationData } from "./types";
import type { UserRole } from "@/lib/roles";

interface ApiUser {
  id: string;
  username: string;
  password?: string;
  name?: string;
  role?: string;
  roles?: string[];
  department?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  faculty: "Faculty",
  auditor: "Auditor",
  "staff-advisor": "Staff Advisor",
  admin: "Admin",
  user: "User",
};

const ROLE_VALUES: UserRole[] = [
  "faculty",
  "auditor",
  "staff-advisor",
  "admin",
  "user",
];

const STATUS_VALUES: AdminUserStatus[] = [
  "pending",
  "active",
  "inactive",
  "suspended",
  "rejected",
];

function normalizeRole(role?: string): UserRole {
  if (!role) return "faculty";
  const normalized = role.trim().toLowerCase();

  if (ROLE_VALUES.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }
  if (
    normalized === "staffadvisor" ||
    normalized === "staff advisor" ||
    normalized === "staff-advisor"
  ) {
    return "staff-advisor";
  }
  if (normalized === "auditor") {
    return "auditor";
  }
  return "faculty";
}

function normalizeStatus(status?: string): AdminUserStatus {
  if (!status) return "active";
  if (status === "approved" || status === "approval") {
    return "active";
  }
  if (STATUS_VALUES.includes(status as AdminUserStatus)) {
    return status as AdminUserStatus;
  }
  return "active";
}

function buildPermissions(role: UserRole) {
  return {
    upload_files: role === "faculty",
    create_reports: role === "faculty",
    view_peer_work: role !== "admin",
    audit_submissions: role === "auditor",
    manage_users: role === "admin",
    view_analytics: role !== "faculty",
  };
}

function formatLastActive(isoDate?: string): string {
  if (!isoDate) return "-";
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "-";
  }
}

function mapApiUserWithEngagement(
  user: ApiUser,
  engagementMap: Record<string, any> = {},
): AdminUser {
  const role = normalizeRole(user.role);
  const name = user.name ?? user.username;
  const engagement = engagementMap[user.id] ?? {};
  const roles = (user as any).roles as UserRole[] | undefined;

  return {
    id: user.id,
    name,
    email: user.email ?? user.username,
    phone: user.phone,
    department: user.department,
    profileImageUrl: user.profileImageUrl,
    resumeUrl: user.resumeUrl,
    resumeFileName: user.resumeFileName,
    designation: ROLE_LABELS[role],
    role,
    roles: roles || [role],
    status: normalizeStatus(user.status),
    lastActive: formatLastActive(user.lastActiveAt),
    joinedDate: user.createdAt?.split("T")[0],
    courseFilesCount: engagement.uploadsCount ?? 0,
    eventReportsCount: engagement.activityParticipationCount ?? 0,
    completionRate: engagement.score ?? 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    permissions: buildPermissions(role),
  };
}

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // Show 20 users per page

  const applyEngagementData = async (baseUsers: AdminUser[]) => {
    try {
      const engagementResponse = await fetch("/api/engagements");
      const engagementData = await engagementResponse.json();
      const engagementMap = (engagementData.engagements ?? []).reduce(
        (acc: Record<string, any>, eng: any) => {
          acc[eng.facultyId] = eng;
          return acc;
        },
        {},
      );

      setUsers((prevUsers) => {
        const source = prevUsers.length > 0 ? prevUsers : baseUsers;
        return source.map((user) => {
          const engagement = engagementMap[user.id] ?? {};
          return {
            ...user,
            courseFilesCount: engagement.uploadsCount ?? user.courseFilesCount,
            eventReportsCount:
              engagement.activityParticipationCount ?? user.eventReportsCount,
            completionRate: engagement.score ?? user.completionRate,
          };
        });
      });
    } catch (error) {
      console.error("Load engagement error:", error);
    }
  };

  const fetchUsers = async (
    page = currentPage,
    query = searchQuery,
    status = filterStatus,
  ) => {
    setIsUsersLoading(true);
    try {
      const searchParams = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
        includeTotal: "1",
      });

      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        searchParams.set("search", trimmedQuery);
      }

      if (status !== "all") {
        searchParams.set("status", status);
      }

      const usersResponse = await fetch(
        `/api/users?${searchParams.toString()}`,
      );
      const usersData = await usersResponse.json();

      if (!usersResponse.ok) {
        toast.error(usersData.error || "Failed to load users");
        return;
      }

      const mappedUsers = (usersData.users as ApiUser[]).map((user) =>
        mapApiUserWithEngagement(user),
      );
      setUsers(mappedUsers);
      setTotalUsers(
        typeof usersData.total === "number"
          ? usersData.total
          : mappedUsers.length,
      );

      if (typeof window !== "undefined") {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => {
            void applyEngagementData(mappedUsers);
          });
        } else {
          setTimeout(() => {
            void applyEngagementData(mappedUsers);
          }, 0);
        }
      } else {
        void applyEngagementData(mappedUsers);
      }
    } catch (error) {
      console.error("Load users error:", error);
      toast.error("Failed to load users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers(currentPage, searchQuery, filterStatus);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentPage, searchQuery, filterStatus]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  const handleSearchChange = (value: string) => {
    setCurrentPage(1);
    setSearchQuery(value);
  };

  const handleFilterStatusChange = (value: string) => {
    setCurrentPage(1);
    setFilterStatus(value);
  };

  const pushNotification = (
    message: string,
    type: NotificationData["type"],
  ) => {
    const notification: NotificationData = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: "Just now",
      read: false,
    };
    setNotifications((prev) => [notification, ...prev]);
  };

  const updateUser = async (id: string, payload: Partial<ApiUser>) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Update failed");
        return null;
      }
      await fetchUsers();
      return (data.users as ApiUser[]).find((user) => user.id === id) ?? null;
    } catch (error) {
      console.error("User update error:", error);
      toast.error("Failed to update user");
      return null;
    }
  };

  const handleUpdateUser = async (payload: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    department?: string;
    role: AdminUser["role"];
    roles?: UserRole[];
    status: AdminUserStatus;
    password?: string;
  }) => {
    const updated = await updateUser(payload.id, {
      username: payload.name,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      department: payload.department,
      role: payload.role,
      roles: payload.roles || [payload.role],
      status: payload.status,
      ...(payload.password ? { password: payload.password } : {}),
    });

    if (updated) {
      toast.success(`User ${updated.name} updated`);
      pushNotification(`User ${updated.name} updated`, "info");
    }
  };

  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    if (isDeletingUser) {
      return false;
    }

    setIsDeletingUser(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Delete failed");
        return false;
      }
      await fetchUsers();
      toast.success("User deleted successfully");
      pushNotification("User deleted", "warning");
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete user");
      return false;
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleStatusChange = async (
    userId: string,
    newStatus: AdminUserStatus,
  ) => {
    const updated = await updateUser(userId, { status: newStatus });
    if (updated) {
      toast.success(`Status updated to ${newStatus}`);
      pushNotification(`Status updated to ${newStatus}`, "info");
    }
  };

  const handleApprove = (userId: string) => {
    handleStatusChange(userId, "active");
  };

  const handleReject = (userId: string) => {
    handleStatusChange(userId, "rejected");
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        unreadCount={unreadCount}
        notifications={notifications}
        showNotifications={showNotifications}
        onToggleNotifications={setShowNotifications}
        onMarkAllRead={markAllAsRead}
        onMarkRead={markNotificationAsRead}
      />

      <AdminStats users={users} totalUsers={totalUsers} />

      <UsersTable
        users={users}
        totalUsers={totalUsers}
        isLoading={isUsersLoading}
        searchQuery={searchQuery}
        filterStatus={filterStatus}
        onSearchChange={handleSearchChange}
        onFilterStatusChange={handleFilterStatusChange}
        onEdit={(user) => {
          setSelectedUser(user);
          setIsEditDialogOpen(true);
        }}
        onDelete={(user) => {
          setUserToDelete(user);
          setIsDeleteDialogOpen(true);
        }}
        onStatusChange={handleStatusChange}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 mt-6">
          <p className="text-sm text-gray-600">
            Showing {totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                currentPage <= 3 ? i + 1 : Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded text-sm ${
                    currentPage === pageNum
                      ? "bg-blue-500 text-white current-page"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdateUser={handleUpdateUser}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!isDeletingUser) {
            setIsDeleteDialogOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{userToDelete?.name}" and
              all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  void handleDeleteUser(userToDelete.id).then((deleted) => {
                    if (deleted) {
                      setIsDeleteDialogOpen(false);
                      setUserToDelete(null);
                    }
                  });
                }
              }}
              disabled={isDeletingUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingUser ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
