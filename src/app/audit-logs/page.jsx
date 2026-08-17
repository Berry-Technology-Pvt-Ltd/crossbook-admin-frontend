"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminClient } from "../../core/api/adminClient";
import AdminSidebar from "../../shared/components/AdminSidebar";
import {
  FileText,
  Search,
  Loader2,
  AlertTriangle,
  Building2,
  RefreshCw,
  User,
  ShieldAlert,
} from "lucide-react";

const fetchAuditLogs = async (search, page) => {
  const res = await adminClient.get("/admin/audit-logs", {
    params: { search, page, limit: 15 },
  });
  return res.data?.data || res.data;
};

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["admin-audit-logs", searchTerm, page],
    queryFn: () => fetchAuditLogs(searchTerm, page),
  });

  const logList = data?.logs || (Array.isArray(data) ? data : []);

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

        {/* Search Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-4 top-3.5 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Filter audit logs by action or log ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
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
                  <th className="p-4">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {logList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No system audit logs recorded.
                    </td>
                  </tr>
                ) : (
                  logList.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-600/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
                          <ShieldAlert size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono font-bold rounded-lg uppercase">
                            {log.action}
                          </span>
                          <div className="text-[10px] text-slate-500 font-normal font-mono mt-1 truncate">
                            {log.id}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                          <Building2 size={14} className="text-slate-500" />
                          {log.tenant?.companyName || "Global Scope"}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <User size={14} className="text-slate-500" />
                          {log.user?.email ||
                            log.metadata?.performedBy ||
                            "System Event"}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-400 max-w-xs truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
