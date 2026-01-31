export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: string;
  department: string;
}

export interface AuthPageProps {
  onLogin: (role: UserRole) => void;
  register: (role: UserRole) => void;
}
export type UserRole = "Faculty" | "Auditor" | "StaffAdvisor";
