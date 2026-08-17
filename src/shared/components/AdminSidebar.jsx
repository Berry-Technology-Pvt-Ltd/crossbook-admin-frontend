"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PackagePlus,
  Users,
  ScrollText,
  Activity,
  LogOut,
} from "lucide-react";

const adminNavItems = [
  { name: "Overview & KPIs", path: "/overview", icon: LayoutDashboard },
  { name: "Tenant Hub", path: "/tenants", icon: Building2 },
  { name: "Addons Hub", path: "/addons", icon: PackagePlus },
  { name: "Users & ACL", path: "/users", icon: Users },
  { name: "Audit Logs", path: "/audit-logs", icon: ScrollText },
  { name: "QBO Health", path: "/health", icon: Activity },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-lg font-black tracking-tight text-white uppercase italic">
          CrossBook{" "}
          <span className="text-purple-400 text-xs block not-italic tracking-widest">
            Admin Command
          </span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "hover:bg-slate-800 hover:text-white text-slate-400"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider transition-all"
        >
          <LogOut size={18} />
          Sign Out Admin
        </button>
      </div>
    </aside>
  );
}
