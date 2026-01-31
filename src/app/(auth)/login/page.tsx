"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SignInForm } from "@/components/AuthPage/SignInForm";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = (role: string) => {
    // Map the role from login form to internal type
    let userRole: UserRole = "faculty";
    if (role === "Auditor") {
      userRole = "auditor";
    } else if (role === "Staff Advisor") {
      userRole = "staff-advisor";
    }

    login(userRole);

    // Set auth cookies for middleware
    document.cookie = `auth_authenticated=true; path=/`;
    document.cookie = `auth_role=${userRole}; path=/`;

    // Redirect to dashboard
    router.push(`/${userRole}/dashboard`);
  };

  return (
    <>
      <SignInForm onLogin={handleLogin} 
      onSwitchToSignUp={() => router.push("/register")}
      />
      <Toaster />
    </>
  );
}
