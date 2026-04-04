import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/jsonDb";
import {
  deleteUserById,
  findUserById,
  findUserByUsername,
  getAllUsers,
  updateUserById,
} from "@/lib/userStore";
import type { Student } from "@/components/StaffAdvisorDashboard/types";
import {
  FACULTY_ASSIGNABLE_ROLES,
  includesAdminRole,
  isPrimaryAdminEmail,
  normalizeRoleInput,
  sanitizeFacultyAssignableRoles,
} from "@/lib/adminConfig";

interface CourseFileRecord {
  id: string;
  facultyId: string;
}

interface EventReportRecord {
  id: string;
  facultyId: string;
}

interface AuditRecord {
  id: string;
  auditorId: string;
  entityType: string;
  entityId: string;
}

interface RemarkRecord {
  id: string;
  authorId: string;
  entityType: string;
  entityId: string;
}

interface EngagementRecord {
  id: string;
  facultyId: string;
  score: number;
  [key: string]: any;
}

interface MessageRecord {
  id: string;
  facultyId: string;
  auditorId?: string;
  entityType?: string;
  entityId?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userById = await findUserById(id);
    const cookieUsername = request.cookies.get("auth_user")?.value ?? "";
    const userByCookie = cookieUsername
      ? await findUserByUsername(cookieUsername)
      : null;
    const user = userById ?? userByCookie;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const existingUser = await findUserById(id);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (Object.prototype.hasOwnProperty.call(payload, "password")) {
      const nextPassword = String(payload.password || "").trim();
      if (!nextPassword) {
        delete payload.password;
      } else if (nextPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 },
        );
      } else {
        payload.password = nextPassword;
      }
    }

    const hasRoleField = Object.prototype.hasOwnProperty.call(payload, "role");
    const hasRolesField = Object.prototype.hasOwnProperty.call(
      payload,
      "roles",
    );

    if (
      hasRolesField &&
      (!Array.isArray(payload.roles) || payload.roles.length === 0)
    ) {
      return NextResponse.json(
        { error: "Roles must be a non-empty array" },
        { status: 400 },
      );
    }

    const requestedRole = hasRoleField
      ? normalizeRoleInput(payload.role)
      : null;
    if (hasRoleField && payload.role && !requestedRole) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const requestedRoles = hasRolesField ? payload.roles : [];
    const existingIsAdmin =
      normalizeRoleInput(existingUser.role) === "admin" ||
      includesAdminRole(existingUser.roles || []);

    if (
      !existingIsAdmin &&
      ((hasRoleField &&
        requestedRole &&
        !FACULTY_ASSIGNABLE_ROLES.includes(requestedRole)) ||
        (hasRolesField &&
          requestedRoles.some(
            (role: any) =>
              !!normalizeRoleInput(role) &&
              !FACULTY_ASSIGNABLE_ROLES.includes(
                normalizeRoleInput(
                  role,
                ) as (typeof FACULTY_ASSIGNABLE_ROLES)[number],
              ),
          )))
    ) {
      return NextResponse.json(
        { error: "Selected roles are not allowed for faculty" },
        { status: 400 },
      );
    }

    if (isPrimaryAdminEmail(existingUser.email || existingUser.username)) {
      if (
        (hasRoleField && requestedRole !== "admin") ||
        (hasRolesField && !includesAdminRole(requestedRoles))
      ) {
        return NextResponse.json(
          { error: "Primary admin role cannot be modified" },
          { status: 403 },
        );
      }

      if (hasRoleField || hasRolesField) {
        payload.role = "admin";
        payload.roles = ["admin"];
      }
    } else if (
      ((hasRoleField && requestedRole === "admin") ||
        (hasRolesField && includesAdminRole(requestedRoles))) &&
      !existingIsAdmin
    ) {
      return NextResponse.json(
        { error: "Assigning admin role is disabled" },
        { status: 403 },
      );
    } else if (existingIsAdmin && (hasRoleField || hasRolesField)) {
      // Existing admin accounts can still be edited (for example password updates),
      // but their admin role remains fixed.
      payload.role = "admin";
      payload.roles = ["admin"];
    } else if (hasRoleField || hasRolesField) {
      const sanitizedRoles = sanitizeFacultyAssignableRoles(
        hasRolesField
          ? requestedRoles
          : [requestedRole || existingUser.role || "faculty"],
      );
      payload.role = sanitizedRoles[0];
      payload.roles = sanitizedRoles;
    }

    await updateUserById(id, payload);
    const users = await getAllUsers();

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ADMIN_ROLE_ASSIGNMENT_DISABLED") {
        return NextResponse.json(
          { error: "Assigning admin role is disabled" },
          { status: 403 },
        );
      }

      if (error.message === "PRIMARY_ADMIN_LOCKED") {
        return NextResponse.json(
          { error: "Primary admin role cannot be modified" },
          { status: 403 },
        );
      }

      if (
        error.message === "PRIMARY_ADMIN_EMAIL_RESERVED" ||
        error.message === "PRIMARY_ADMIN_IDENTITY_RESERVED"
      ) {
        return NextResponse.json(
          { error: "Primary admin identity is reserved" },
          { status: 403 },
        );
      }

      if (
        error.message === "INVALID_ROLE" ||
        error.message === "INVALID_ROLES"
      ) {
        return NextResponse.json(
          { error: "Invalid role payload" },
          { status: 400 },
        );
      }
    }

    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user first so core admin action succeeds even if legacy cleanup fails.
    await deleteUserById(id);

    const courseFiles = await readJsonFile<CourseFileRecord[]>(
      "courseFiles.json",
    ).catch(() => []);
    const eventReports = await readJsonFile<EventReportRecord[]>(
      "eventReports.json",
    ).catch(() => []);
    const audits = await readJsonFile<AuditRecord[]>("audits.json").catch(
      () => [],
    );
    const remarks = await readJsonFile<RemarkRecord[]>("remarks.json").catch(
      () => [],
    );
    const students = await readJsonFile<Student[]>("students.json").catch(
      () => [],
    );
    const engagements = await readJsonFile<EngagementRecord[]>(
      "engagements.json",
    ).catch(() => []);
    const messages = await readJsonFile<MessageRecord[]>(
      "auditorMessages.json",
    ).catch(() => []);

    const removedFileIds = courseFiles
      .filter((file) => file.facultyId === id)
      .map((file) => file.id);
    const removedReportIds = eventReports
      .filter((report) => report.facultyId === id)
      .map((report) => report.id);

    const updatedFiles = courseFiles.filter((file) => file.facultyId !== id);
    const updatedReports = eventReports.filter(
      (report) => report.facultyId !== id,
    );

    const updatedAudits = audits.filter(
      (audit) =>
        audit.auditorId !== id &&
        !(
          (audit.entityType === "course-file" &&
            removedFileIds.includes(audit.entityId)) ||
          (audit.entityType === "event-report" &&
            removedReportIds.includes(audit.entityId))
        ),
    );

    const updatedRemarks = remarks.filter(
      (remark) =>
        remark.authorId !== id &&
        !(
          (remark.entityType === "course-file" &&
            removedFileIds.includes(remark.entityId)) ||
          (remark.entityType === "event-report" &&
            removedReportIds.includes(remark.entityId))
        ),
    );

    const updatedStudents = students.filter(
      (student) => student.advisorId !== id,
    );

    const updatedEngagements = engagements.filter(
      (engagement) => engagement.facultyId !== id,
    );

    const updatedMessages = messages.filter(
      (message) => message.facultyId !== id && message.auditorId !== id,
    );

    // Best-effort legacy JSON cleanup. Ignore write failures in serverless environments.
    await Promise.allSettled([
      writeJsonFile("courseFiles.json", updatedFiles),
      writeJsonFile("eventReports.json", updatedReports),
      writeJsonFile("audits.json", updatedAudits),
      writeJsonFile("remarks.json", updatedRemarks),
      writeJsonFile("students.json", updatedStudents),
      writeJsonFile("engagements.json", updatedEngagements),
      writeJsonFile("auditorMessages.json", updatedMessages),
    ]);

    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
