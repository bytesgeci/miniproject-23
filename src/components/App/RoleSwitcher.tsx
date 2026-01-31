import { Button } from "@/components/ui/button";
import { GraduationCap, Shield, Users } from "lucide-react";
import { UserRole } from "@/context/AuthContext";

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const roles: Array<{
    role: UserRole;
    label: string;
    icon: typeof GraduationCap;
  }> = [
    { role: "faculty", label: "Faculty Portal", icon: GraduationCap },
    { role: "auditor", label: "Auditor Portal", icon: Shield },
    { role: "staff-advisor", label: "Staff Advisor Portal", icon: Users },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {roles.map(({ role, label, icon: Icon }) => (
        <Button
          key={role}
          variant={currentRole === role ? "default" : "outline"}
          onClick={() => {
            onRoleChange(role);
          }}
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
