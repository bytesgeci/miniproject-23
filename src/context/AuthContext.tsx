"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type UserRole = "faculty" | "auditor" | "staff-advisor";

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (role: UserRole) => void;
  register: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("faculty");
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("auth_authenticated");
    const savedRole = localStorage.getItem("auth_role") as UserRole;

    if (savedAuth === "true" && savedRole) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
    }
    setIsLoading(false);
  }, []);

  const login = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem("auth_authenticated", "true");
    localStorage.setItem("auth_role", role);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole("faculty");
    localStorage.removeItem("auth_authenticated");
    localStorage.removeItem("auth_role");
  };

  const switchRole = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem("auth_role", role);
  };

  const register = (role: UserRole) => {
  setUserRole(role);
  setIsAuthenticated(true);
  localStorage.setItem("auth_authenticated", "true");
  localStorage.setItem("auth_role", role);
};

  const value = {
    isAuthenticated,
    userRole,
    login,
    register,
    logout,
    switchRole,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
