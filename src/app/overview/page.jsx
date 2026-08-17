"use client";

import { useQuery } from "@tanstack/react-query";
import { adminClient } from "../../core/api/adminClient";
import AdminSidebar from "../../shared/components/AdminSidebar";
import Link from "next/link";
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
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

// Fetcher function for Overview KPIs
const fetchOverviewData = async () => {
  const res = await adminClient.get("/admin/overview");
  return res.data?.metrics || res.data?.data || res.data;
};

export default function AdminOverviewPage() {
  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchOverviewData,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center text-purple-400">
          <Loader2 className="animate-spin" size={36} />
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <AdminSidebar />
        <main className="flex-1 p-10 flex flex-col items-center justify-center">
          <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-rose-400 flex items-center gap-3 max-w-lg">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">
                Failed to load platform overview telemetry
              </h4>
              <p className="text-xs text-rose-400/80 mt-1">
                {error?.response?.data?.message || error.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            Retry Fetch
          </button>
        </main>
      </div>
    );
  }

  // Normalized Metrics
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
    total: data?.totalAddons || 0,
    active: data?.activeAddonsCount || data?.activeEntitlementsCount || 0,
    expired: data?.expiredAddonsCount || 0,
  };

  const qboConnectedCount =
    data?.qboConnectedCount || data?.qbo?.connected || 0;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Refresh Metrics"
            >
              <RefreshCw
                size={16}
                className={isRefetching ? "animate-spin" : ""}
              />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <Activity size={14} className="animate-pulse" />
              Engine Online
            </div>
          </div>
        </div>

        {/* KPI Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Total Tenants */}
          <Link
            href="/tenants"
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-xl cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Building2 size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ArrowUpRight size={12} /> Live
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Total Organizations
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">
                {tenantMetrics.total}
              </h3>
            </div>

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
          </Link>

          {/* Card 2: Platform Users */}
          <Link
            href="/users"
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-xl cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Users size={24} />
                </div>
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  <ArrowUpRight size={12} /> Directory
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Total Platform Users
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">
                {userMetrics.total}
              </h3>
            </div>

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
          </Link>

          {/* Card 3: Addons & Entitlements */}
          <Link
            href="/addons"
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-xl cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <PackageCheck size={24} />
                </div>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <ArrowUpRight size={12} /> Catalog
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Active Entitlements
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">
                {addonMetrics.active}
              </h3>
            </div>

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
          </Link>

          {/* Card 4: QBO Integration Status (Linked to /health) */}
          <Link
            href="/health"
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-xl cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ArrowUpRight size={12} /> Health
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                QBO Connected Nodes
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">
                {qboConnectedCount}
              </h3>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                OAuth Active
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Launch & System State Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg font-bold text-white tracking-tight uppercase mb-2">
              Platform Security & Lifecycle Telemetry
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              All cross-tenant pipelines, subscription validity guards, and
              dynamic RBAC modules are operating under nominal load conditions.
              Active user sessions and tenant access boundaries are strictly
              enforced.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
                  Tenant Isolation Mode
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Strict Schema Partitioning
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                  RBAC Enforcement
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Zero-Trust Scoped Tokens
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-purple-400 mb-4">
                <ShieldAlert size={20} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Quick Governance Access
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Inspect administrative event history, identity provisions, and
                security policy modifications.
              </p>
            </div>
            <Link
              href="/audit-logs"
              className="w-full flex items-center justify-between px-5 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <span>Audit Ledger</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
