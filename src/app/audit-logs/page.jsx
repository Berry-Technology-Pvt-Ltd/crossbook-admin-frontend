"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminClient } from "../../core/api/adminClient";
import AdminSidebar from "../../shared/components/AdminSidebar";
import {
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Building2,
  User,
  ShieldAlert,
  Clock,
  ChevronLeft,
  ChevronRight,
  Code,
  Download,
  CalendarRange,
} from "lucide-react";

// API Fetchers
const fetchAuditLogs = async (tenantId, action, page, startDate, endDate) => {
  // 💡 FIX 1: Trim spaces and normalize spaces to underscores for flexible action searching
  const cleanAction = action ? action.trim().replace(/\s+/g, "_") : undefined;

  const res = await adminClient.get("/admin/audit-logs", {
    params: {
      tenantId: tenantId || undefined,
      action: cleanAction || undefined,
      page,
      limit: 15,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
  });
  return res.data?.data || res.data;
};

// Reads a filename out of a Content-Disposition header, falling back to a
// sensible default if the header is missing or unparsable.
const filenameFromContentDisposition = (headerValue, fallback) => {
  const match = /filename="?([^";]+)"?/i.exec(headerValue || "");
  return match?.[1] || fallback;
};

const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

const fetchTenants = async () => {
  const res = await adminClient.get("/admin/tenants", {
    params: { limit: 100 },
  });
  return res.data?.data || res.data;
};

export default function AuditLogsPage() {
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null);

  // 1. Fetch Audit Logs Query
  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: [
      "admin-audit-logs",
      selectedTenant,
      selectedAction,
      page,
      startDate,
      endDate,
    ],
    queryFn: () =>
      fetchAuditLogs(selectedTenant, selectedAction, page, startDate, endDate),
  });

  const handleExport = async (format) => {
    setExportingFormat(format);
    try {
      const res = await adminClient.get("/admin/audit-logs/export", {
        params: {
          tenantId: selectedTenant || undefined,
          action: selectedAction ? selectedAction.trim() : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          format,
        },
        responseType: "blob",
      });

      const fallbackName = `audit-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
      const filename = filenameFromContentDisposition(
        res.headers?.["content-disposition"],
        fallbackName,
      );
      triggerBlobDownload(res.data, filename);
      toast.success(`Audit log export (${format.toUpperCase()}) downloaded.`);
    } catch (err) {
      console.error("Audit log export failed:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to export audit logs.",
      );
    } finally {
      setExportingFormat(null);
    }
  };

  // 2. Fetch Tenants for Filter Dropdown
  const { data: tenantsData } = useQuery({
    queryKey: ["admin-tenants-lookup"],
    queryFn: fetchTenants,
  });

  const rawLogs =
    data?.logs || data?.data?.logs || (Array.isArray(data) ? data : []);
  const logsList = Array.isArray(rawLogs) ? rawLogs : [];

  const pagination = data?.pagination ||
    data?.data?.pagination || {
      total: logsList.length,
      page: 1,
      totalPages: 1,
    };

  const rawTenants =
    tenantsData?.tenants ||
    tenantsData?.data?.tenants ||
    (Array.isArray(tenantsData) ? tenantsData : []);
  const tenantList = Array.isArray(rawTenants) ? rawTenants : [];

  const formatActionName = (action) => {
    return String(action || "UNKNOWN_ACTION").replace(/_/g, " ");
  };

  const getActionBadgeColor = (action = "") => {
    const act = String(action).toUpperCase();
    if (act.includes("CREATE") || act.includes("ASSIGN"))
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (
      act.includes("REVOKE") ||
      act.includes("DELETE") ||
      act.includes("DEACTIVAT") ||
      act.includes("SUSPEND")
    )
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (act.includes("UPDATE") || act.includes("STATUS"))
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-purple-400 bg-purple-500/10 border-purple-500/20";
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
              Audit Trail Hub
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
              Cross-Tenant Security Forensics & System Action Ledger
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("csv")}
              disabled={exportingFormat !== null}
              className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              title="Export CSV"
            >
              {exportingFormat === "csv" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Export CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              disabled={exportingFormat !== null}
              className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              title="Export JSON"
            >
              {exportingFormat === "json" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Export JSON
            </button>
            <button
              onClick={() => refetch()}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw
                size={18}
                className={isRefetching ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <select
              value={selectedTenant}
              onChange={(e) => {
                setSelectedTenant(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer appearance-none"
            >
              <option value="">All Organizations / Tenants</option>
              {tenantList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.companyName || t.id}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search
              className="absolute left-4 top-3.5 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Filter by action (e.g. USER_CREATED)..."
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 pl-10 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative">
            <CalendarRange
              className="absolute left-4 top-3.5 text-slate-500"
              size={16}
            />
            <input
              type="date"
              aria-label="Start date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 pl-10 text-xs text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
            />
          </div>

          <div className="relative">
            <CalendarRange
              className="absolute left-4 top-3.5 text-slate-500"
              size={16}
            />
            <input
              type="date"
              aria-label="End date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 pl-10 text-xs text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
            />
          </div>

          {(selectedTenant || selectedAction || startDate || endDate) && (
            <div className="flex items-center">
              <button
                onClick={() => {
                  setSelectedTenant("");
                  setSelectedAction("");
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Data Viewport */}
        {isLoading ? (
          <div className="flex h-64 bg-slate-900 border border-slate-800 rounded-3xl items-center justify-center text-purple-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-rose-500 gap-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <AlertTriangle size={20} />
            <span>
              Failed to fetch audit logs:{" "}
              {error?.response?.data?.message || error.message}
            </span>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="p-4 pl-6">Action / Event</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Executed By</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right pr-6">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {logsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No system audit logs recorded or matching filters.
                    </td>
                  </tr>
                ) : (
                  logsList.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const meta = log.metadata || {};
                    const actor =
                      meta.performedBy || log.user?.email || "System Engine";

                    // 💡 FIX 2: Check all possible timestamp properties from backend
                    const rawTimestamp =
                      log.createdAt ||
                      log.created_at ||
                      log.timestamp ||
                      meta.timestamp;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 pl-6 font-bold text-white">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getActionBadgeColor(
                              log.action,
                            )}`}
                          >
                            <ShieldAlert size={12} />
                            {formatActionName(log.action)}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Building2
                              size={13}
                              className="text-purple-400 flex-shrink-0"
                            />
                            <span className="truncate">
                              {log.tenant?.companyName ||
                                (log.tenantId
                                  ? `Tenant #${log.tenantId.slice(0, 8)}`
                                  : "Platform Global")}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-500" />
                            <span>{actor}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-500" />
                            <span>
                              {rawTimestamp
                                ? new Date(rawTimestamp).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() =>
                                setExpandedLogId(isExpanded ? null : log.id)
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-slate-400 hover:text-white rounded-lg text-[10px] font-mono cursor-pointer transition-all"
                            >
                              <Code size={11} />{" "}
                              {isExpanded ? "Hide JSON" : "Inspect JSON"}
                            </button>
                            {isExpanded && (
                              <div className="text-left bg-slate-950 border border-slate-800 p-3 rounded-xl mt-2 w-full max-w-xs overflow-x-auto">
                                <pre className="text-[10px] text-purple-300 font-mono">
                                  {JSON.stringify(meta, null, 2)}
                                </pre>
                              </div>
                            )}
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
      </main>
    </div>
  );
}
