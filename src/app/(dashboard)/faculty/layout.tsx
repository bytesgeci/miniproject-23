"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { RoleSwitcher } from "@/components/App/RoleSwitcher";
import { useRouter } from "next/navigation";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, switchRole } = useAuth();
  const router = useRouter();

  const handleRoleChange = (role: typeof userRole) => {
    switchRole(role);
    document.cookie = `auth_role=${role}; path=/`;
    router.push(`/${role}/dashboard`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RoleSwitcher currentRole={userRole} onRoleChange={handleRoleChange} />
      {children}
    </div>
  );
}
