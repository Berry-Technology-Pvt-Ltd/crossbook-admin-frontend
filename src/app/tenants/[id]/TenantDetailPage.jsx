"use client";

export const runtime = "edge";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTenantById,
  updateTenantStatus,
} from "../../../core/api/tenantService";
import {
  getGlobalAddons,
  assignTenantEntitlement,
  revokeTenantEntitlement,
} from "../../../core/api/addonService";
import { createTenantUser } from "../../../core/api/userService";
import { adminClient } from "../../../core/api/adminClient";
import AdminSidebar from "../../../shared/components/AdminSidebar";
import {
  Building2,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Layers,
  Users,
  Hash,
  RefreshCw,
  X,
  UserPlus,
  Shield,
  ShieldAlert,
  FileSpreadsheet,
  CheckSquare,
  Activity,
  Code,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

// Scoped Polymorphic Audit Fetcher
const fetchTenantAuditLogs = async (tenantId, module) => {
  const res = await adminClient.get("/admin/audit-logs", {
    params: {
      tenantId,
      module,
      limit: 20,
    },
  });
  return res.data?.data || res.data;
};

export default function TenantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [activeAuditTab, setActiveAuditTab] = useState("PLATFORM"); // 'PLATFORM' | 'VOUCHER' | 'CHECK'
  const [expandedLogId, setExpandedLogId] = useState(null);

  const [userFormData, setUserFormData] = useState({
    email: "",
    fullName: "",
    role: "ACCOUNTANT",
    password: "",
  });

  // 1. Fetch Tenant Deep Details
  const {
    data: tenantResponse,
    isLoading: isTenantLoading,
    isError: isTenantError,
    error: tenantError,
    refetch: refetchTenant,
    isRefetching,
  } = useQuery({
    queryKey: ["admin-tenant-detail", id],
    queryFn: () => getTenantById(id),
    enabled: !!id,
  });

  // 2. Fetch Global Addons Catalog
  const { data: addonsResponse, isLoading: isAddonsLoading } = useQuery({
    queryKey: ["admin-addons"],
    queryFn: () => getGlobalAddons(),
  });

  // 3. Fetch Scoped Audit Logs for Current Selected Tab
  const {
    data: scopedAuditData,
    isLoading: isAuditLoading,
    refetch: refetchAuditLogs,
    isRefetching: isAuditRefetching,
  } = useQuery({
    queryKey: ["admin-tenant-audit-scoped", id, activeAuditTab],
    queryFn: () => fetchTenantAuditLogs(id, activeAuditTab),
    enabled: !!id,
  });

  // Safe Data Normalization
  const tenant =
    tenantResponse?.data?.tenant ||
    tenantResponse?.data ||
    tenantResponse ||
    {};

  const rawAddons =
    addonsResponse?.addons ||
    addonsResponse?.data?.addons ||
    addonsResponse?.data ||
    addonsResponse ||
    [];
  const globalAddons = Array.isArray(rawAddons) ? rawAddons : [];

  const sequences = Array.isArray(tenant?.voucherSequences)
    ? tenant.voucherSequences
    : Array.isArray(tenant?.sequences)
      ? tenant.sequences
      : [];

  const tenantUsers = Array.isArray(tenant?.users) ? tenant.users : [];
  const activeEntitlements = Array.isArray(tenant?.entitlements)
    ? tenant.entitlements
    : Array.isArray(tenant?.addons)
      ? tenant.addons
      : [];

  const rawAuditLogs =
    scopedAuditData?.logs ||
    scopedAuditData?.data?.logs ||
    (Array.isArray(scopedAuditData) ? scopedAuditData : []);
  const auditLogsList = Array.isArray(rawAuditLogs) ? rawAuditLogs : [];

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: (nextStatus) => updateTenantStatus(id, nextStatus),
    onSuccess: () => {
      toast.success("Tenant status updated successfully");
      queryClient.invalidateQueries(["admin-tenant-detail", id]);
      queryClient.invalidateQueries(["admin-tenants"]);
      refetchAuditLogs();
    },
    onError: (err) => {
      toast.error("Failed to update status", { description: err.message });
    },
  });

  const assignAddonMutation = useMutation({
    mutationFn: (slug) => assignTenantEntitlement(id, slug),
    onSuccess: () => {
      toast.success("Addon assigned successfully");
      queryClient.invalidateQueries(["admin-tenant-detail", id]);
      refetchAuditLogs();
    },
    onError: (err) => {
      toast.error("Failed to assign addon", { description: err.message });
    },
  });

  const revokeAddonMutation = useMutation({
    mutationFn: (slug) => revokeTenantEntitlement(id, slug),
    onSuccess: () => {
      toast.success("Addon revoked successfully");
      queryClient.invalidateQueries(["admin-tenant-detail", id]);
      refetchAuditLogs();
    },
    onError: (err) => {
      toast.error("Failed to revoke addon", { description: err.message });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (payload) => createTenantUser({ ...payload, tenantId: id }),
    onSuccess: () => {
      toast.success("Scoped User provisioned successfully!");
      setIsAddUserModalOpen(false);
      setUserFormData({
        email: "",
        fullName: "",
        role: "ACCOUNTANT",
        password: "",
      });
      queryClient.invalidateQueries(["admin-tenant-detail", id]);
      refetchAuditLogs();
    },
    onError: (err) => {
      toast.error("Failed to provision user", { description: err.message });
    },
  });

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userFormData.email.trim() || !userFormData.password.trim()) {
      toast.error("Email and Password are required");
      return;
    }
    createUserMutation.mutate(userFormData);
  };

  const isAddonAssigned = (slug) => {
    if (!slug) return false;
    return activeEntitlements.some((ent) => {
      const entSlug =
        typeof ent === "string"
          ? ent
          : ent?.addon?.slug || ent?.addonSlug || ent?.slug;
      return (
        String(entSlug || "")
          .trim()
          .toUpperCase() === String(slug).trim().toUpperCase()
      );
    });
  };

  const getActionBadgeColor = (action = "") => {
    const act = String(action).toUpperCase();
    if (
      act.includes("CREATE") ||
      act.includes("ASSIGN") ||
      act.includes("ENABLED") ||
      act.includes("APPROVED")
    )
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (
      act.includes("REVOKE") ||
      act.includes("DELETE") ||
      act.includes("DEACTIVAT") ||
      act.includes("SUSPEND") ||
      act.includes("VOID")
    )
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (
      act.includes("UPDATE") ||
      act.includes("STATUS") ||
      act.includes("LOCKED")
    )
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-purple-400 bg-purple-500/10 border-purple-500/20";
  };

  if (isTenantLoading) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-purple-500" size={36} />
        </main>
      </div>
    );
  }

  if (isTenantError || !tenant?.id) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <AdminSidebar />
        <main className="flex-1 p-10">
          <button
            onClick={() => router.push("/tenants")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Tenants Hub
          </button>
          <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-rose-400 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>
              Failed to load tenant details:{" "}
              {tenantError?.message || "Tenant not found"}
            </span>
          </div>
        </main>
      </div>
    );
  }

  const currentStatus = String(tenant.status || "ACTIVE").toUpperCase();
  const isSuspended = currentStatus === "SUSPENDED";
  const isInactive = currentStatus === "INACTIVE";
  const isExpired =
    tenant.validUntil && new Date(tenant.validUntil) < new Date();
  const mutationsLocked = isSuspended || isInactive;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/tenants")}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">
                  {typeof tenant.companyName === "string"
                    ? tenant.companyName
                    : "Organization Details"}
                </h1>
                {isExpired ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Clock size={11} /> EXPIRED
                  </span>
                ) : isInactive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    <Ban size={11} /> OFFBOARDED
                  </span>
                ) : isSuspended ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Ban size={11} /> SUSPENDED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={11} /> ACTIVE
                  </span>
                )}
              </div>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                Tenant ID: {String(tenant.id)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchTenant()}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw
                size={16}
                className={isRefetching ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() =>
                toggleStatusMutation.mutate(
                  isSuspended ? "ACTIVE" : "SUSPENDED",
                )
              }
              disabled={toggleStatusMutation.isPending || isInactive}
              title={
                isInactive
                  ? "This tenant has been offboarded and cannot be reactivated from this screen."
                  : undefined
              }
              className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSuspended
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              }`}
            >
              {isSuspended ? "Activate Organization" : "Suspend Organization"}
            </button>
          </div>
        </div>

        {mutationsLocked && (
          <div className="flex items-center gap-3 mb-8 -mt-2 px-5 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <AlertTriangle size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isInactive
                ? "This tenant has been offboarded. Organization-mutating actions are disabled."
                : "This tenant is suspended. Organization-mutating actions are disabled until it is reactivated."}
            </span>
          </div>
        )}

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 text-purple-400 mb-4">
              <Building2 size={20} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Quick Details
              </h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-500 font-medium">QBO Realm ID</span>
                <span className="font-mono text-slate-200">
                  {tenant.qboRealmId
                    ? String(tenant.qboRealmId)
                    : "Not Connected"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-500 font-medium">Created On</span>
                <span className="text-slate-200">
                  {tenant.createdAt
                    ? new Date(tenant.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">
                  Validity Period
                </span>
                <span className="text-slate-200 font-medium">
                  {tenant.validUntil ? (
                    <span className="text-purple-400">
                      Until {new Date(tenant.validUntil).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-emerald-400">Lifetime Access</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Sequence Bootstrapping */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl md:col-span-2">
            <div className="flex items-center gap-3 text-indigo-400 mb-4">
              <Hash size={20} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Financial Voucher Sequences
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {sequences.length === 0 ? (
                <p className="text-slate-500 col-span-2">
                  No active sequence trackers found.
                </p>
              ) : (
                sequences.map((seq, index) => {
                  const typeStr = String(seq.type || "SEQUENCE").toUpperCase();
                  const prefixStr =
                    seq.prefix ||
                    `${typeStr}-${seq.year || new Date().getFullYear()}-`;
                  const nextNum = (Number(seq.lastNumber) || 0) + 1;

                  return (
                    <div
                      key={seq.id || index}
                      className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4"
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        {typeStr === "PV"
                          ? "Payment Voucher (PV)"
                          : typeStr === "CV"
                            ? "Cheque Voucher (CV)"
                            : typeStr}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-mono font-bold">
                          Prefix: {prefixStr}
                        </span>
                        <span className="text-purple-400 font-mono text-[11px] bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                          Next: #{nextNum}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modules & Entitlements Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3 text-purple-400">
              <Layers size={20} />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Addon Entitlements Matrix
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Toggle feature modules scoped for this tenant
                </p>
              </div>
            </div>
          </div>

          {isAddonsLoading ? (
            <div className="flex justify-center p-8 text-purple-400">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : globalAddons.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No global addons registered yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalAddons.map((item, index) => {
                const addonObj = item?.addon || item || {};
                const addonName =
                  typeof addonObj?.name === "string"
                    ? addonObj.name
                    : typeof addonObj?.slug === "string"
                      ? addonObj.slug
                      : "Module";
                const addonSlug =
                  typeof addonObj?.slug === "string"
                    ? addonObj.slug
                    : String(item?.slug || "");

                const isAssigned = isAddonAssigned(addonSlug);
                const isPending =
                  assignAddonMutation.isPending ||
                  revokeAddonMutation.isPending;

                return (
                  <div
                    key={addonObj.id || addonSlug || index}
                    className={`border rounded-2xl p-4.5 flex items-center justify-between transition-all ${
                      isAssigned
                        ? "bg-purple-950/20 border-purple-500/30"
                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {addonName}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                        {addonSlug}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        isAssigned
                          ? revokeAddonMutation.mutate(addonSlug)
                          : assignAddonMutation.mutate(addonSlug)
                      }
                      disabled={isPending || !addonSlug || mutationsLocked}
                      title={
                        mutationsLocked
                          ? "Disabled while this tenant is suspended or offboarded."
                          : undefined
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isAssigned
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-purple-500"
                      }`}
                    >
                      {isAssigned ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scoped Users Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3 text-purple-400">
              <Users size={20} />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Scoped Organization Users
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Team members assigned to this boundary
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              disabled={mutationsLocked}
              title={
                mutationsLocked
                  ? "Disabled while this tenant is suspended or offboarded."
                  : undefined
              }
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
            >
              <UserPlus size={14} /> Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tenantUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No users scoped under this tenant yet.
                    </td>
                  </tr>
                ) : (
                  tenantUsers.map((u, index) => {
                    const roleDisplay =
                      typeof u?.role === "string"
                        ? u.role
                        : u?.role?.name ||
                          u?.role?.role ||
                          u?.userRole ||
                          "ACCOUNTANT";

                    const joinedDate =
                      u?.createdAt || u?.joinedAt || u?.created_at;

                    return (
                      <tr key={u.id || index} className="hover:bg-slate-800/20">
                        <td className="py-3 font-semibold text-slate-200">
                          {typeof u.fullName === "string" && u.fullName
                            ? u.fullName
                            : u.email}
                          <div className="text-[10px] text-slate-500 font-normal">
                            {u.email}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-purple-300 border border-slate-700">
                            <Shield size={10} />{" "}
                            {String(roleDisplay).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              String(u.status || "ACTIVE").toUpperCase() ===
                              "ACTIVE"
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-rose-400 bg-rose-500/10"
                            }`}
                          >
                            {String(u.status || "ACTIVE").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">
                          {joinedDate
                            ? new Date(joinedDate).toLocaleDateString()
                            : "Just now"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🏛️ ENTERPRISE SCOPED AUDIT SUB-LEDGERS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4 mb-6">
            <div className="flex items-center gap-3 text-purple-400">
              <ShieldAlert size={20} />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Scoped Audit & Module Ledgers
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Forensic audit trail strictly bound to this organization
                </p>
              </div>
            </div>

            {/* Module Switcher Tabs */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => {
                  setActiveAuditTab("PLATFORM");
                  setExpandedLogId(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeAuditTab === "PLATFORM"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Activity size={13} /> Platform
              </button>
              <button
                onClick={() => {
                  setActiveAuditTab("VOUCHER");
                  setExpandedLogId(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeAuditTab === "VOUCHER"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileSpreadsheet size={13} /> Voucher Ledger
              </button>
              <button
                onClick={() => {
                  setActiveAuditTab("CHECK");
                  setExpandedLogId(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeAuditTab === "CHECK"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CheckSquare size={13} /> Check Ledger
              </button>
              <button
                onClick={() => {
                  setActiveAuditTab("INVOICE");
                  setExpandedLogId(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeAuditTab === "INVOICE"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Receipt size={13} /> Invoice Ledger
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          {isAuditLoading || isAuditRefetching ? (
            <div className="flex h-44 items-center justify-center text-purple-400">
              <Loader2 className="animate-spin" size={26} />
            </div>
          ) : auditLogsList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No audit logs recorded for this organization under{" "}
              {activeAuditTab} ledger.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3">Action / Event</th>
                    <th className="pb-3">Executed By</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogsList.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const meta = log.metadata || {};
                    const actor =
                      meta.performedBy || log.user?.email || "System Engine";

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="py-3 font-semibold text-slate-200">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(
                              log.action,
                            )}`}
                          >
                            {String(log.action || "EVENT").replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-300 text-[11px]">
                          {actor}
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() =>
                              setExpandedLogId(isExpanded ? null : log.id)
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-950 border border-slate-800 hover:border-purple-500 text-slate-400 hover:text-white rounded-lg text-[10px] font-mono cursor-pointer transition-all"
                          >
                            <Code size={11} /> {isExpanded ? "Hide" : "Inspect"}
                          </button>
                          {isExpanded && (
                            <div className="text-left bg-slate-950 border border-slate-800 p-3 rounded-xl mt-2 w-full max-w-sm ml-auto overflow-x-auto shadow-xl">
                              <pre className="text-[10px] text-purple-300 font-mono">
                                {JSON.stringify(meta, null, 2)}
                              </pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Provision User Modal */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    Add Scoped User
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    Assign new member to{" "}
                    {typeof tenant.companyName === "string"
                      ? tenant.companyName
                      : "Organization"}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={userFormData.fullName}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={userFormData.email}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Role
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, role: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={userFormData.password}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        password: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    {createUserMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
