"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAdminAuthStore } from "../store/useAdminStore";

export default function AdminAuthGuard({ children }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  const { isAuthenticated, isLoading, fetchAdminProfile, clearAuth } =
    useAdminAuthStore();

  useEffect(() => {
    if (isLoginRoute) return;

    const hasSession =
      Boolean(sessionStorage.getItem("x-admin-key")) ||
      Boolean(sessionStorage.getItem("admin-token")) ||
      Boolean(localStorage.getItem("admin-token"));

    if (!hasSession) {
      clearAuth();
      window.location.href = "/login";
      return;
    }

    fetchAdminProfile().catch(() => {
      clearAuth();
      window.location.href = "/login";
    });
  }, [clearAuth, fetchAdminProfile, isLoginRoute]);

  if (isLoginRoute) return children;

  if (isLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-400">
        <Loader2 className="animate-spin" size={32} />
      </main>
    );
  }

  return children;
}
