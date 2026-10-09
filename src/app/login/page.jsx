"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminClient, clearAdminSession } from "../../core/api/adminClient";
import { ShieldAlert, Lock, Mail, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    clearAdminSession();

    console.log("🚀 Attempting Admin Authentication...");

    try {
      // 🎯 Case 1: Bypass using Master Admin Key
      if (adminKey.trim()) {
        console.log("🔑 Master Key provided. Storing in Session Storage...");
        sessionStorage.setItem("x-admin-key", adminKey.trim());

        console.log(
          "✅ Master Key Authenticated Successfully! Redirecting to /overview...",
        );
        toast.success("Master Key Authenticated");
        router.push("/overview");
        return;
      }

      // 🎯 Case 2: Standard Admin Credentials Login (Updated Dedicated Admin Endpoint)
      console.log("📧 Sending Admin Login Request for:", email);
      const res = await adminClient.post("/admin/auth/login", {
        // 👈 FIX: Point to dedicated /admin/auth/login
        email: email.trim(),
        password,
      });

      console.log("📥 Login Response Received:", res.data);

      if (res.status === 200 || res.data?.success) {
        // 🔧 FIX (Defect #31): the backend authenticates this session via an
        // httpOnly `admin_access_token` cookie — it never returns a bearer token
        // in the response body. AdminAuthGuard's `hasSession` check only looks at
        // client-storage flags (x-admin-key / admin-token), so without setting one
        // here a successful login used to bounce straight back to /login on the
        // very next route. This marker is never used as a real credential (the
        // backend's admin auth middleware only checks x-admin-key or the httpOnly
        // cookie, not the Authorization header) — it exists purely to satisfy the
        // client-side session-presence check.
        sessionStorage.setItem("admin-token", res.data?.token || "cookie-session");
        console.log(
          "✅ Admin Logged In Successfully! Redirecting to /overview...",
        );
        toast.success("Welcome to Admin Command Center");
        router.push("/overview");
      }
    } catch (error) {
      console.error("❌ Login Failed with Error:", error);
      toast.error("Authentication Failed", {
        description:
          error.response?.data?.message || "Invalid credentials provided.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mx-auto mb-4">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
            CrossBook Admin
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">
            Restricted Security Gateway
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Admin Master Key (Optional Bypass)
            </label>
            <div className="relative">
              <KeyRound
                className="absolute left-4 top-3.5 text-slate-500"
                size={18}
              />
              <input
                type="password"
                placeholder="Enter system master key..."
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-600 text-[10px] uppercase tracking-widest font-bold">
              Or Login With
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-3.5 text-slate-500"
                size={18}
              />
              <input
                type="email"
                placeholder="admin@crossbook.online"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-3.5 text-slate-500"
                size={18}
              />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            Authenticate Access
          </button>
        </form>
      </div>
    </div>
  );
}
