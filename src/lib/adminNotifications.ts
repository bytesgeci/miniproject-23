import { readJsonFile, writeJsonFile } from "@/lib/jsonDb";

const ADMIN_NOTIFICATIONS_FILE = "adminNotifications.json";

export interface AdminNotificationRecord {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}

function toTimestamp(value?: string) {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function listAdminNotifications() {
  const notifications = await readJsonFile<AdminNotificationRecord[]>(
    ADMIN_NOTIFICATIONS_FILE,
  );

  return notifications
    .filter((item) => item && typeof item.id === "string")
    .sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp));
}

export async function createAdminNotification(
  notification: Omit<AdminNotificationRecord, "id" | "timestamp" | "read"> & {
    id?: string;
    timestamp?: string;
    read?: boolean;
  },
) {
  const notifications = await listAdminNotifications();

  const nextNotification: AdminNotificationRecord = {
    id:
      notification.id ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: notification.type,
    message: notification.message,
    timestamp: notification.timestamp || new Date().toISOString(),
    read: Boolean(notification.read),
    ...(notification.userId ? { userId: notification.userId } : {}),
  };

  await writeJsonFile(ADMIN_NOTIFICATIONS_FILE, [
    nextNotification,
    ...notifications,
  ]);
  return nextNotification;
}

export async function markAdminNotificationRead(id: string) {
  const notifications = await listAdminNotifications();
  const updated = notifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );
  await writeJsonFile(ADMIN_NOTIFICATIONS_FILE, updated);
}

export async function markAllAdminNotificationsRead() {
  const notifications = await listAdminNotifications();
  await writeJsonFile(
    ADMIN_NOTIFICATIONS_FILE,
    notifications.map((notification) => ({ ...notification, read: true })),
  );
}
