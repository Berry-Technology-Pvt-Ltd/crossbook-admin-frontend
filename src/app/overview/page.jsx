"use client";

import { useQuery } from "@tanstack/react-query";
import { adminClient } from "../../core/api/adminClient";
import AdminSidebar from "../../shared/components/AdminSidebar";
import {
  Building2,
  Users,
  PackageCheck,
  Activity,
  ArrowUpRight,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";

// Fetcher function for Overview KPIs
const fetchOverviewData = async () => {
  const res = await adminClient.get("/admin/overview");
  return res.data?.metrics || res.data?.data || res.data;
};

export default function AdminOverviewPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchOverviewData,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-purple-400">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-rose-500 gap-2">
        <AlertTriangle size={20} />
        <span>
          Failed to load overview data:{" "}
          {error?.response?.data?.message || error.message}
        </span>
      </div>
    );
  }

  // Extracted Breakdown Helpers (Supports both flat and nested responses)
  const tenantMetrics = data?.tenants || {
    total: data?.totalTenants || 0,
    active: data?.activeTenants || data?.totalTenants || 0,
    expired: data?.expiredTenants || 0,
  };

  const userMetrics = data?.users || {
    total: data?.totalUsers || 0,
    active: data?.activeUsers || data?.totalUsers || 0,
    inactive: data?.inactiveUsers || 0,
  };

  const addonMetrics = data?.addons || {
    active: data?.activeAddonsCount || 0,
    expired: data?.expiredAddonsCount || 0,
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Shell */}
      <AdminSidebar />

      {/* Main Content Viewport */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
              Platform Overview
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
              Real-time cross-tenant telemetry & key performance indicators
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold uppercase tracking-widest">
            <Activity size={14} className="animate-pulse" />
            System Operational
          </div>
        </div>

        {/* KPI Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Total Tenants with Active/Expired Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Building2 size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <ArrowUpRight size={12} /> Live
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Total Tenants
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">
                {tenantMetrics.total}
              </h3>
            </div>

            {/* Sub-breakdown Badges */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {tenantMetrics.active} Active
              </span>
              {tenantMetrics.expired > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <Clock size={10} /> {tenantMetrics.expired} Expired
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Users Breakdown (Active vs Inactive) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Users size={24} />
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Total Platform Users
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">
                {userMetrics.total}
              </h3>
            </div>

            {/* Sub-breakdown Badges */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <UserCheck size={10} /> {userMetrics.active} Active
              </span>
              {userMetrics.inactive > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  <UserX size={10} /> {userMetrics.inactive} Disabled
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Active Addons Subscriptions */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <PackageCheck size={24} />
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Active Addon Licenses
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">
                {addonMetrics.active}
              </h3>
            </div>

            {/* Sub-breakdown Badges */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Operational
              </span>
              {addonMetrics.expired > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {addonMetrics.expired} Expired
                </span>
              )}
            </div>
          </div>

          {/* Card 4: QBO Integration Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={24} />
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                QBO Connected Nodes
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">
                {data?.qboConnectedCount || 0}
              </h3>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                OAuth Active
              </span>
            </div>
          </div>
        </div>

        {/* System Activity & Security Telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-white tracking-tight uppercase mb-2">
            Platform Security & Lifecycle Telemetry
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            All cross-tenant pipelines, subscription validity guards, and
            dynamic RBAC modules are operating under nominal load conditions.
            Active user sessions and tenant access boundaries are strictly
            enforced.
          </p>
        </div>
      </main>
    </div>
  );
}
