import { GraduationCap, Shield, Users } from "lucide-react";

export type UserRole = "faculty" | "auditor" | "staff-advisor";

export interface RoleInfo {
  name: string;
  icon: typeof GraduationCap;
  color: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleInfo> = {
  faculty: {
    name: "Faculty",
    icon: GraduationCap,
    color: "bg-blue-600",
  },
  auditor: {
    name: "Quality Auditor",
    icon: Shield,
    color: "bg-orange-600",
  },
  "staff-advisor": {
    name: "Staff Advisor",
    icon: Users,
    color: "bg-green-600",
  },
};

export function getRoleInfo(role: UserRole): RoleInfo {
  return ROLE_CONFIG[role];
}
