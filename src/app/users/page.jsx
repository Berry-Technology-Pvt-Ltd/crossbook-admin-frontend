"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  createTenantUser,
  updateUserStatus,
  deactivateUser,
} from "../../core/api/userService";
import { getTenants } from "../../core/api/tenantService";
import AdminSidebar from "../../shared/components/AdminSidebar";
import {
  Search,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Building2,
  RefreshCw,
  Mail,
  UserCheck,
  UserX,
  Clock,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function UsersACLPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const [formData, setFormData] = useState({
    tenantId: "",
    email: "",
    fullName: "",
    role: "ACCOUNTANT",
    password: "",
  });

  const queryClient = useQueryClient();

  // 1. Fetch Users Query
  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["admin-users", searchTerm, page],
    queryFn: () => getUsers({ search: searchTerm, page, limit: 10 }),
  });

  // 2. Fetch Tenants List for Modal Dropdown
  const { data: tenantsData } = useQuery({
    queryKey: ["admin-tenants-lookup"],
    queryFn: () => getTenants({ limit: 100 }),
    enabled: isCreateModalOpen,
  });

  const rawUsers =
    data?.data?.users || data?.users || (Array.isArray(data) ? data : []);
  const userList = Array.isArray(rawUsers) ? rawUsers : [];
  const pagination = data?.data?.pagination ||
    data?.pagination || {
      total: userList.length,
      page: 1,
      totalPages: 1,
    };

  const rawTenants =
    tenantsData?.data?.tenants ||
    tenantsData?.tenants ||
    (Array.isArray(tenantsData) ? tenantsData : []);
  const tenantList = Array.isArray(rawTenants) ? rawTenants : [];

  // 3. Provision User Mutation
  const createUserMutation = useMutation({
    mutationFn: createTenantUser,
    onSuccess: () => {
      toast.success("User provisioned successfully!");
      setIsCreateModalOpen(false);
      setFormData({
        tenantId: "",
        email: "",
        fullName: "",
        role: "ACCOUNTANT",
        password: "",
      });
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => {
      toast.error("Failed to provision user", {
        description: err.message,
      });
    },
  });

  // 4. Toggle Account Status Mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const nextStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      return await updateUserStatus(id, nextStatus);
    },
    onSuccess: () => {
      toast.success("User account status updated successfully");
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => {
      toast.error("Failed to update user status", {
        description: err.message,
      });
    },
  });

  // 5. Deactivate / Delete User Mutation
  const deactivateMutation = useMutation({
    mutationFn: (id) => deactivateUser(id),
    onSuccess: () => {
      toast.success("User deactivated successfully");
      setDeactivateTarget(null);
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => {
      toast.error("Failed to deactivate user", {
        description: err.message,
      });
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.tenantId) {
      toast.error("Please select a target organization/tenant");
      return;
    }
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    createUserMutation.mutate(formData);
  };

  // Status Badges Renderer
  const renderUserStatus = (usr) => {
    const status = String(usr.status || "ACTIVE").toUpperCase();
    const tenantValidUntil = usr.tenant?.validUntil;
    const isTenantExpired =
      tenantValidUntil && new Date(tenantValidUntil) < new Date();

    if (status === "ACTIVE") {
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck size={11} /> Active
          </span>
          {isTenantExpired && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              <Clock size={10} /> Tenant Expired
            </span>
          )}
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
        <UserX size={11} /> Deactivated
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
              Users & ACL Hub
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
              Cross-Tenant Identity, Account Status Toggles & Role Access Policy
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
              title="Refresh Users"
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
              <Plus size={16} /> Provision User
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
              placeholder="Search users by email or organization..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex h-64 bg-slate-900 border border-slate-800 rounded-3xl items-center justify-center text-purple-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-rose-500 gap-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <AlertTriangle size={20} />
            <span>Failed to fetch users: {error?.message}</span>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="p-4 pl-6">Identity / Email</th>
                  <th className="p-4">Assigned Tenant</th>
                  <th className="p-4">Role & Access Level</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {userList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No system accounts or tenant users found.
                    </td>
                  </tr>
                ) : (
                  userList.map((usr) => {
                    const roleDisplay =
                      typeof usr?.role === "string"
                        ? usr.role
                        : usr?.role?.name ||
                          usr?.role?.slug ||
                          usr?.userRole ||
                          "Standard User";

                    const isSystemRole =
                      usr?.role?.isSystem ||
                      String(roleDisplay).toLowerCase().includes("admin");

                    return (
                      <tr
                        key={usr.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0">
                            <Mail size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-100">
                              {usr.fullName || usr.email}
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal font-mono truncate">
                              {usr.email}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-xs text-slate-300">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                            <Building2
                              size={14}
                              className="text-purple-400 flex-shrink-0"
                            />
                            <span className="truncate">
                              {usr.tenant?.companyName ||
                                usr.companyName ||
                                "System Scope"}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isSystemRole
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-slate-800 text-slate-300 border border-slate-700/50"
                            }`}
                          >
                            <ShieldCheck size={12} />
                            {String(roleDisplay).toUpperCase()}
                          </span>
                        </td>

                        {/* Status Column */}
                        <td className="p-4">{renderUserStatus(usr)}</td>

                        {/* Actions */}
                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                toggleUserStatusMutation.mutate({
                                  id: usr.id,
                                  status: usr.status || "ACTIVE",
                                })
                              }
                              disabled={toggleUserStatusMutation.isPending}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer disabled:opacity-50 ${
                                (usr.status || "ACTIVE").toUpperCase() ===
                                "ACTIVE"
                                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              }`}
                            >
                              {(usr.status || "ACTIVE").toUpperCase() ===
                              "ACTIVE"
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            <button
                              onClick={() => setDeactivateTarget(usr)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                              title="Delete / Revoke Access"
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

        {/* Provision User Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    Provision User
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    Assign member across tenant boundaries
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
                    Target Organization / Tenant *
                  </label>
                  <select
                    required
                    value={formData.tenantId}
                    onChange={(e) =>
                      setFormData({ ...formData, tenantId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      Select an organization
                    </option>
                    {tenantList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.companyName || t.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
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
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
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
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
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
                    disabled={createUserMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    {createUserMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Provision User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deactivation Confirmation Modal */}
        {deactivateTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Confirm User Deactivation
                </h3>
              </div>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Are you sure you want to revoke access for{" "}
                <strong className="text-white">
                  {deactivateTarget.fullName || deactivateTarget.email}
                </strong>
                ?
              </p>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-400 mb-6">
                💡 <strong>Revocation Notice:</strong> The user will lose access
                to organization resources immediately.
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeactivateTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deactivateMutation.mutate(deactivateTarget.id)}
                  disabled={deactivateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  {deactivateMutation.isPending && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Confirm Deactivation
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
