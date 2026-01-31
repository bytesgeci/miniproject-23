import type { Metadata } from "next";
import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "Faculty Management System",
  description: "College Faculty Management and Audit Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
