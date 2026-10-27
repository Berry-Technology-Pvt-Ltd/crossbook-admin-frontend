"use client";

export const runtime = "edge";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserById,
  assignUserToTenant,
  updateMembership,
  revokeMembership,
  updateUser,
  updateUserStatus,
} from "../../../core/api/userService";
import UserPermissionMatrix from "../../../components/UserPermissionMatrix";
import { getTenants } from "../../../core/api/tenantService";
import AdminSidebar from "../../../shared/components/AdminSidebar";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  Mail,
  Calendar,
  Layers,
  Pencil,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetTenantId, setTargetTenantId] = useState("");
  const [targetRole, setTargetRole] = useState("ACCOUNTANT");
  const [targetPermissions, setTargetPermissions] = useState([]);
  const [targetIsAdmin, setTargetIsAdmin] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [editedName, setEditedName] = useState("");

  // Fetch User Details & Memberships
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: () => getUserById(id),
  });

  // Fetch Tenants for Assignment Modal
  const { data: tenantsData } = useQuery({
    queryKey: ["admin-tenants-all"],
    queryFn: () => getTenants({ limit: 100 }),
    enabled: isAssignModalOpen,
  });

  // Assign Workspace Mutation
  const assignTenantMutation = useMutation({
    mutationFn: async () => {
      return await assignUserToTenant({
        userId: id,
        tenantId: targetTenantId,
        role: targetRole,
        permissions: targetPermissions,
        isAdmin: targetIsAdmin,
      });
    },
    onSuccess: () => {
      toast.success("Workspace assigned successfully!");
      setIsAssignModalOpen(false);
      setTargetTenantId("");
      setTargetPermissions([]);
      setTargetIsAdmin(false);
      queryClient.invalidateQueries(["admin-user-detail", id]);
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to assign workspace.",
      );
    },
  });

  // Revoke Membership Mutation
  const revokeMembershipMutation = useMutation({
    mutationFn: async (membershipId) => {
      return await revokeMembership(membershipId);
    },
    onSuccess: () => {
      toast.success("Workspace access revoked.");
      queryClient.invalidateQueries(["admin-user-detail", id]);
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to revoke access.",
      );
    },
  });

  const updateMembershipMutation = useMutation({
    mutationFn: ({ membershipId, permissions, isAdmin, status }) =>
      updateMembership(membershipId, { permissions, isAdmin, status }),
    onSuccess: () => {
      toast.success("Workspace permissions updated successfully.");
      setEditingMembership(null);
      queryClient.invalidateQueries(["admin-user-detail", id]);
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error || "Failed to update workspace permissions.",
      );
    },
  });

  // Reactivate (or suspend) a single workspace membership directly from the row.
  const reactivateMembershipMutation = useMutation({
    mutationFn: (membership) =>
      updateMembership(membership.id, {
        permissions: membership.permissions || [],
        isAdmin: membership.isAdmin === true,
        status: "ACTIVE",
      }),
    onSuccess: () => {
      toast.success("Workspace access reactivated.");
      queryClient.invalidateQueries(["admin-user-detail", id]);
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error || "Failed to reactivate workspace access.",
      );
    },
  });

  // Global Account Status Mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: (nextStatus) => updateUserStatus(id, nextStatus),
    onSuccess: () => {
      toast.success("User status updated successfully.");
      queryClient.invalidateQueries(["admin-user-detail", id]);
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error || "Failed to update user status.",
      );
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: () => updateUser(id, { name: editedName }),
    onSuccess: () => {
      toast.success("User name updated successfully.");
      queryClient.invalidateQueries(["admin-user-detail", id]);
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to update user name."),
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
        <main className="flex-1 p-10 flex flex-col items-center justify-center text-rose-400 gap-3">
          <AlertTriangle size={36} />
          <p>Failed to load user: {error?.message}</p>
          <button
            onClick={() => router.push("/users")}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-bold"
          >
            Back to Users
          </button>
        </main>
      </div>
    );
  }

  const resolvedUser = data?.data || data?.user || data;
  const memberships = resolvedUser?.memberships || [];
  const userStatus = String(resolvedUser?.status || "ACTIVE").toUpperCase();
  const isUserActive = userStatus === "ACTIVE";
  const rawTenants =
    tenantsData?.data?.data?.tenants ||
    tenantsData?.data?.tenants ||
    tenantsData?.tenants ||
    (Array.isArray(tenantsData) ? tenantsData : []);
  const tenantList = Array.isArray(rawTenants) ? rawTenants : [];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/users")}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white mb-6 cursor-pointer group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Users Directory
        </button>

        {/* Global Identity Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 text-2xl font-black shrink-0">
              {resolvedUser?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {resolvedUser?.name ||
                    resolvedUser?.fullName ||
                    resolvedUser?.email?.split("@")[0]}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isUserActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {isUserActive ? (
                    <UserCheck size={11} />
                  ) : (
                    <UserX size={11} />
                  )}
                  {userStatus}
                </span>
              </div>
              <form
                className="mt-3 flex max-w-md gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  updateUserMutation.mutate();
                }}
              >
                <input
                  value={editedName || resolvedUser?.name || ""}
                  onChange={(event) => setEditedName(event.target.value)}
                  placeholder="Full Name"
                  aria-label="Full Name"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Name"}
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} /> {resolvedUser?.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> Joined{" "}
                  {new Date(
                    resolvedUser?.createdAt || Date.now(),
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                toggleUserStatusMutation.mutate(
                  isUserActive ? "INACTIVE" : "ACTIVE",
                )
              }
              disabled={toggleUserStatusMutation.isPending}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider rounded-2xl border transition-all cursor-pointer disabled:opacity-50 ${
                isUserActive
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
            >
              {isUserActive ? <XCircle size={16} /> : <UserCheck size={16} />}
              {isUserActive ? "Deactivate Account" : "Activate Account"}
            </button>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Plus size={16} /> Assign to Workspace
            </button>
          </div>
        </div>

        {/* Workspace Memberships Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-purple-400" />
              Assigned Organizations ({memberships.length})
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="p-4 pl-6">Organization / Tenant</th>
                  <th className="p-4">Scoped Role</th>
                  <th className="p-4">Membership Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {memberships.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      This user is not assigned to any organizations yet.
                    </td>
                  </tr>
                ) : (
                  memberships.map((m) => {
                    const membershipStatus = String(
                      m.status || "ACTIVE",
                    ).toUpperCase();
                    const isMembershipActive = membershipStatus === "ACTIVE";

                    return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                          <Building2 size={16} className="text-purple-400" />
                        </div>
                        <div>
                          <div className="text-slate-100 font-semibold">
                            {m.tenant?.companyName || "Workspace"}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {m.tenantId}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-purple-300 uppercase">
                          <ShieldCheck size={13} className="text-purple-400" />
                          {m.role?.name || m.role?.slug || "Member"}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isMembershipActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {isMembershipActive ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          {membershipStatus}
                        </span>
                      </td>

                      <td className="p-4 text-right pr-6">
                        <div className="flex justify-end gap-2">
                          {!isMembershipActive && (
                            <button
                              onClick={() =>
                                reactivateMembershipMutation.mutate(m)
                              }
                              disabled={reactivateMembershipMutation.isPending}
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                              title="Reactivate Workspace Access"
                            >
                              <UserCheck size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingMembership(m);
                            }}
                            className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-xl transition-all cursor-pointer"
                            title="Edit Workspace Permissions"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() =>
                              revokeMembershipMutation.mutate(m.id)
                            }
                            disabled={revokeMembershipMutation.isPending}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                            title="Revoke Tenant Access"
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
          </div>
        </div>

        {editingMembership && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-2">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    Edit Membership
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {editingMembership.tenant?.companyName || "Workspace"}
                  </p>
                </div>
                <button
                  onClick={() => setEditingMembership(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <UserPermissionMatrix
                permissions={editingMembership.permissions || []}
                isAdmin={editingMembership.isAdmin === true}
                onPermissionsChange={(permissions) =>
                  setEditingMembership((current) => ({
                    ...current,
                    permissions,
                  }))
                }
                onIsAdminChange={(isAdmin) =>
                  setEditingMembership((current) => ({ ...current, isAdmin }))
                }
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
                <button
                  onClick={() => setEditingMembership(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateMembershipMutation.mutate({
                      membershipId: editingMembership.id,
                      permissions: editingMembership.permissions || [],
                      isAdmin: editingMembership.isAdmin === true,
                    })
                  }
                  disabled={updateMembershipMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  {updateMembershipMutation.isPending && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    Assign Workspace
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    Grant access to a new organization
                  </p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Select Organization *
                  </label>
                  <select
                    value={targetTenantId}
                    onChange={(e) => setTargetTenantId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose an organization
                    </option>
                    {tenantList
                      .filter(
                        (t) => !memberships.some((m) => m.tenantId === t.id),
                      )
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.companyName || t.id}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Workspace Role *
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <UserPermissionMatrix
                  permissions={targetPermissions}
                  isAdmin={targetIsAdmin}
                  onPermissionsChange={setTargetPermissions}
                  onIsAdminChange={setTargetIsAdmin}
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => assignTenantMutation.mutate()}
                    disabled={!targetTenantId || assignTenantMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    {assignTenantMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Confirm Assignment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
