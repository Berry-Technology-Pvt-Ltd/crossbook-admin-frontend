"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTenants,
  createTenant,
  updateTenantStatus,
  offboardTenant,
} from "../../core/api/tenantService";
import AdminSidebar from "../../shared/components/AdminSidebar";
import {
  Building2,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  Calendar,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function TenantHubPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [offboardTarget, setOffboardTarget] = useState(null);

  // New Tenant Form State (with Optional validUntil)
  const [formData, setFormData] = useState({
    companyName: "",
    qboRealmId: "",
    validUntil: "",
    voucherSequencePrefix: "PV-",
    checkSequencePrefix: "CV-",
  });

  // 1. Fetch Tenants Query
  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["admin-tenants", searchTerm, page],
    queryFn: () => getTenants({ search: searchTerm, page, limit: 10 }),
  });

  const tenantList =
    data?.data?.tenants || data?.tenants || (Array.isArray(data) ? data : []);
  const pagination = data?.data?.pagination ||
    data?.pagination || {
      total: tenantList.length,
      page: 1,
      totalPages: 1,
    };

  // 2. Provision Tenant Mutation
  const createTenantMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      toast.success("Tenant provisioned successfully!");
      setIsCreateModalOpen(false);
      setFormData({
        companyName: "",
        qboRealmId: "",
        validUntil: "",
        voucherSequencePrefix: "PV-",
        checkSequencePrefix: "CV-",
      });
      queryClient.invalidateQueries(["admin-tenants"]);
    },
    onError: (err) => {
      toast.error("Failed to provision tenant", {
        description: err.message,
      });
    },
  });

  // 3. Status Toggle Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updateTenantStatus(id, nextStatus),
    onSuccess: () => {
      toast.success("Tenant status updated successfully");
      queryClient.invalidateQueries(["admin-tenants"]);
    },
    onError: (err) => {
      toast.error("Failed to update status", {
        description: err.message,
      });
    },
  });

  // 4. Safe Soft-Delete Offboarding Mutation
  const offboardMutation = useMutation({
    mutationFn: (id) => offboardTenant(id),
    onSuccess: () => {
      toast.success("Tenant offboarded successfully");
      setOffboardTarget(null);
      queryClient.invalidateQueries(["admin-tenants"]);
    },
    onError: (err) => {
      toast.error("Failed to offboard tenant", {
        description: err.message,
      });
    },
  });

  // Status Badge Renderer
  const renderStatusBadge = (tenant) => {
    const rawStatus = (tenant.status || "ACTIVE").toUpperCase();
    const isExpired =
      tenant.validUntil && new Date(tenant.validUntil) < new Date();

    if (isExpired || rawStatus === "EXPIRED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Clock size={12} /> EXPIRED
        </span>
      );
    }

    if (rawStatus === "SUSPENDED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Ban size={12} /> SUSPENDED
        </span>
      );
    }

    if (rawStatus === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} /> ACTIVE
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
        <XCircle size={12} /> INACTIVE
      </span>
    );
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error("Company Name is required");
      return;
    }
    createTenantMutation.mutate(formData);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
              Tenant Hub
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
              Multi-Tenant Provisioning, Lifecycle & Access Boundaries
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw
                size={18}
                className={isRefetching ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Plus size={16} /> Provision Tenant
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-4 top-3.5 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tenants by company name or Realm ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Table Viewport */}
        {isLoading ? (
          <div className="flex h-64 bg-slate-900 border border-slate-800 rounded-3xl items-center justify-center text-purple-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-rose-500 gap-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <AlertTriangle size={20} />
            <span>Failed to fetch tenants: {error?.message}</span>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="p-4 pl-6">Organization</th>
                  <th className="p-4">QBO Realm ID</th>
                  <th className="p-4">Subscription Validity</th>
                  <th className="p-4">Lifecycle Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {tenantList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No registered tenants found in database.
                    </td>
                  </tr>
                ) : (
                  tenantList.map((tenant) => {
                    const currentStatus = (
                      tenant.status || "ACTIVE"
                    ).toUpperCase();
                    const isSuspended = currentStatus === "SUSPENDED";

                    return (
                      <tr
                        key={tenant.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 flex-shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() =>
                                router.push(`/tenants/${tenant.id}`)
                              }
                              className="text-left font-semibold text-slate-100 hover:text-purple-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                            >
                              <span className="truncate">
                                {tenant.companyName || "Unnamed Tenant"}
                              </span>
                              <ExternalLink
                                size={12}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400"
                              />
                            </button>
                            <div className="text-[10px] text-slate-500 font-normal font-mono truncate">
                              {tenant.id}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-300">
                          {tenant.qboRealmId || "N/A"}
                        </td>

                        <td className="p-4 text-xs text-slate-300 font-medium">
                          {tenant.validUntil ? (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Calendar size={13} className="text-purple-400" />
                              <span>
                                Until{" "}
                                {new Date(
                                  tenant.validUntil,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                              Unlimited / Lifetime
                            </span>
                          )}
                        </td>

                        {/* Lifecycle Status Column */}
                        <td className="p-4">{renderStatusBadge(tenant)}</td>

                        {/* Dynamic Action Buttons */}
                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  id: tenant.id,
                                  nextStatus: isSuspended
                                    ? "ACTIVE"
                                    : "SUSPENDED",
                                })
                              }
                              disabled={toggleStatusMutation.isPending}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer disabled:opacity-50 ${
                                isSuspended
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                              }`}
                            >
                              {isSuspended ? "Activate" : "Suspend"}
                            </button>

                            <button
                              onClick={() => setOffboardTarget(tenant)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                              title="Offboard Tenant (Soft Delete)"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 px-6 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
                <span>
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-30 hover:text-white cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-30 hover:text-white cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Provision Tenant Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    Provision Tenant
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    Initialize organization & financial sequences
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    QBO Realm ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 934145214562145"
                    value={formData.qboRealmId}
                    onChange={(e) =>
                      setFormData({ ...formData, qboRealmId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Subscription Validity (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Leave blank for Unlimited / Lifetime access.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Payment Voucher Prefix
                    </label>
                    <input
                      type="text"
                      value={formData.voucherSequencePrefix}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          voucherSequencePrefix: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Check Voucher Prefix
                    </label>
                    <input
                      type="text"
                      value={formData.checkSequencePrefix}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checkSequencePrefix: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTenantMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    {createTenantMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Provision Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Offboard Confirmation Modal */}
        {offboardTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Confirm Tenant Offboarding
                </h3>
              </div>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Are you sure you want to offboard{" "}
                <strong className="text-white">
                  {offboardTarget.companyName}
                </strong>
                ?
              </p>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-400 mb-6">
                💡 <strong>Audit Retention Policy:</strong> This action will
                soft-delete the tenant. All financial sequences, audit trails,
                and voucher history will be retained safely.
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOffboardTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => offboardMutation.mutate(offboardTarget.id)}
                  disabled={offboardMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  {offboardMutation.isPending && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Confirm Offboarding
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
