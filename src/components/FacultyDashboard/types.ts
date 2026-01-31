import { FacultyMember, DashboardStats } from "../../types/faculty";

export type { FacultyMember, DashboardStats };

export interface Activity {
  action: string;
  item: string;
  time: string;
}
