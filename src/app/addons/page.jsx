"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGlobalAddons, createAddon } from "../../core/api/addonService";
import AdminSidebar from "../../shared/components/AdminSidebar";
import {
  PackageCheck,
  Layers,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function AddonsHubPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  // 1. Fetch Addons Query
  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["admin-addons"],
    queryFn: () => getGlobalAddons(),
  });

  // 2. Create Addon Mutation
  const createAddonMutation = useMutation({
    mutationFn: createAddon,
    onSuccess: () => {
      toast.success("Addon module created successfully!");
      setIsCreateModalOpen(false);
      setFormData({ name: "", slug: "", description: "" });
      queryClient.invalidateQueries(["admin-addons"]);
    },
    onError: (err) => {
      toast.error("Failed to create addon", {
        description: err.message,
      });
    },
  });

  const addonList = Array.isArray(data)
    ? data
    : data?.data?.addons || data?.addons || data?.data || [];

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Name and Slug are required fields");
      return;
    }
    createAddonMutation.mutate({
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase(),
      description: formData.description.trim(),
    });
  };

  const handleNameChange = (name) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData((prev) => ({
      ...prev,
      name,
      slug:
        prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug,
    }));
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
              Addons Hub
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
              Global Platform Extensions, Entitlements & Subscription Expiry
              Controls
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
              title="Refresh Addons"
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
              <Plus size={16} /> Create Addon
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        {isLoading ? (
          <div className="flex h-64 bg-slate-900 border border-slate-800 rounded-3xl items-center justify-center text-purple-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-rose-500 gap-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <AlertTriangle size={20} />
            <span>Failed to load addons: {error?.message}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {addonList.length === 0 ? (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500">
                No active system addons registered yet.
              </div>
            ) : (
              addonList.map((addon) => {
                const totalLinked =
                  addon._count?.entitlements || addon.entitlementsCount || 0;
                const activeCount =
                  addon.activeEntitlementsCount ?? totalLinked;
                const expiredCount = addon.expiredEntitlementsCount || 0;

                return (
                  <div
                    key={addon.id || addon.slug}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xl group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber-600/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
                          <PackageCheck size={24} />
                        </div>
                        <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
                          {addon.slug}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                        {addon.name}
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed mb-6">
                        {addon.description ||
                          "Core platform extension module providing specialized financial workflows."}
                      </p>
                    </div>

                    {/* Subscription & Entitlement Telemetry Footer */}
                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-400">
                        <Layers size={14} className="text-slate-500" />
                        <span>
                          Total Linked:{" "}
                          <strong className="text-white">{totalLinked}</strong>
                        </span>
                      </div>

                      {/* Dynamic Status Breakdown Badges */}
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={11} /> {activeCount} Active
                        </span>

                        {expiredCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                            <Clock size={11} /> {expiredCount} Expired
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Create Addon Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    Register Addon Module
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    Define a new platform entitlement
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
                    Addon Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Multi-Currency Engine"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Identifier Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. multi-currency-engine"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a brief explanation of this module's capabilities..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
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
                    disabled={createAddonMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    {createAddonMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Register Addon
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
