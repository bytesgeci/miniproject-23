"use client";

import { useRouter } from "next/navigation";
import { SignUpForm } from "@/components/AuthPage/SignUpForm";
import { useAuth, UserRole } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = (role: UserRole) => {
    // Call auth register
    register(role);

    // Persist auth state (optional, depends on your setup)
    document.cookie = `auth_authenticated=true; path=/`;
    document.cookie = `auth_role=${role}; path=/`;

    // Redirect after registration
    router.push("/dashboard");
  };

  return (
 <SignUpForm
      onSignUpSuccess={handleSubmit}
      onSwitchToSignIn={() => router.push("/login")}
    />  );
}