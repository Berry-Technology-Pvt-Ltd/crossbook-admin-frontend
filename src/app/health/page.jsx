"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminClient } from "../../core/api/adminClient";
import AdminSidebar from "../../shared/components/AdminSidebar";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Bell,
  Building2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const fetchQboHealth = async () => {
  const res = await adminClient.get("/admin/health/qbo");
  return res.data?.health || res.data;
};

export default function QboHealthPage() {
  // 🎯 Track notified tenant IDs locally for immediate UI feedback
  const [notifiedTenants, setNotifiedTenants] = useState([]);

  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["admin-qbo-health"],
    queryFn: fetchQboHealth,
  });

  const notifyMutation = useMutation({
    mutationFn: async (tenantId) => {
      return await adminClient.post(
        `/admin/health/qbo/${tenantId}/reconnect-notify`,
      );
    },
    onSuccess: (res, tenantId) => {
      // 🎯 Add tenantId to local notified tracker
      setNotifiedTenants((prev) => [...prev, tenantId]);

      toast.success(
        res.data?.message || "Reconnect alert sent to tenant admin",
      );
    },
    onError: (err) => {
      toast.error("Failed to send notification", {
        description: err.response?.data?.error || err.message,
      });
    },
  });

  const healthList = Array.isArray(data) ? data : [];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
              QBO Health Hub
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
              QuickBooks Online Token Health, Sync Telemetry & Re-Authentication
              Alerts
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
            title="Refresh Health"
          >
            <RefreshCw
              size={18}
              className={isRefetching ? "animate-spin" : ""}
            />
          </button>
        </div>

        {/* Content Viewport */}
        {isLoading ? (
          <div className="flex h-64 bg-slate-900 border border-slate-800 rounded-3xl items-center justify-center text-purple-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-rose-500 gap-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <AlertTriangle size={20} />
            <span>
              Failed to fetch QBO health metrics:{" "}
              {error?.response?.data?.message || error.message}
            </span>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="p-4 pl-6">Organization</th>
                  <th className="p-4">QBO Realm ID</th>
                  <th className="p-4">Sync Status</th>
                  <th className="p-4">Last Telemetry</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {healthList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No tenant connections registered.
                    </td>
                  </tr>
                ) : (
                  healthList.map((item) => {
                    const isNotified = notifiedTenants.includes(item.tenantId);
                    const isNotifyingThis =
                      notifyMutation.isPending &&
                      notifyMutation.variables === item.tenantId;

                    return (
                      <tr
                        key={item.tenantId}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-600/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-100">
                              {item.companyName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal font-mono truncate">
                              {item.tenantId}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-300">
                          {item.realmId}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === "CONNECTED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : item.status === "TOKEN_EXPIRING_SOON"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {item.status === "CONNECTED" ? (
                              <CheckCircle2 size={12} />
                            ) : item.status === "TOKEN_EXPIRING_SOON" ? (
                              <AlertTriangle size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {item.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {item.lastUpdated
                            ? new Date(item.lastUpdated).toLocaleString()
                            : "—"}
                        </td>
                        <td className="p-4 text-right pr-6">
                          {isNotified ? (
                            /* 🎯 Live State Feedback: Alert Sent */
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 ml-auto">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Alert Sent
                            </span>
                          ) : (
                            /* 🎯 Standard Action Button */
                            <button
                              onClick={() =>
                                notifyMutation.mutate(item.tenantId)
                              }
                              disabled={
                                notifyMutation.isPending ||
                                item.status === "CONNECTED"
                              }
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700/50 cursor-pointer disabled:opacity-40 flex items-center gap-1.5 ml-auto"
                            >
                              {isNotifyingThis ? (
                                <Loader2
                                  size={12}
                                  className="animate-spin text-purple-400"
                                />
                              ) : (
                                <Bell size={12} />
                              )}
                              Notify Reconnect
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
