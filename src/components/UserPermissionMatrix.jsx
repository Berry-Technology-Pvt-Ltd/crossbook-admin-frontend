"use client";

import { SYSTEM_MODULES } from "../shared/constants/moduleRegistry";

const moduleList = Object.values(SYSTEM_MODULES);

export default function UserPermissionMatrix({
  permissions = [],
  isAdmin = false,
  onPermissionsChange,
  onIsAdminChange,
}) {
  const selectedPermissions = new Set(permissions);

  const updatePermissions = (nextPermissions) => {
    onPermissionsChange?.([...new Set(nextPermissions)].sort());
  };

  const togglePermission = (permission) => {
    const nextPermissions = new Set(selectedPermissions);
    if (nextPermissions.has(permission)) {
      nextPermissions.delete(permission);
    } else {
      nextPermissions.add(permission);
    }
    updatePermissions([...nextPermissions]);
  };

  const toggleModule = (module) => {
    const modulePermissions = module.actions.map(
      (action) => `${module.key}:${action}`,
    );
    const allSelected = modulePermissions.every((permission) =>
      selectedPermissions.has(permission),
    );
    const nextPermissions = new Set(selectedPermissions);

    modulePermissions.forEach((permission) => {
      if (allSelected) {
        nextPermissions.delete(permission);
      } else {
        nextPermissions.add(permission);
      }
    });

    updatePermissions([...nextPermissions]);
  };

  return (
    <section className="border-t border-slate-800 pt-5 mt-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-white">
            Permission Matrix
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Configure tenant-scoped module actions.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(event) => onIsAdminChange?.(event.target.checked)}
            className="h-4 w-4 accent-purple-600"
          />
          Tenant Admin
        </label>
      </div>

      {!isAdmin && (
        <div className="space-y-3">
          {moduleList.map((module) => {
            const modulePermissions = module.actions.map(
              (action) => `${module.key}:${action}`,
            );
            const allSelected = modulePermissions.every((permission) =>
              selectedPermissions.has(permission),
            );

            return (
              <div
                key={module.key}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">
                    {module.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleModule(module)}
                    className="text-[10px] font-bold uppercase tracking-wider text-purple-300 hover:text-purple-200"
                  >
                    {allSelected ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {module.actions.map((action) => {
                    const permission = `${module.key}:${action}`;
                    return (
                      <label
                        key={permission}
                        className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(permission)}
                          onChange={() => togglePermission(permission)}
                          className="h-3.5 w-3.5 accent-purple-600"
                        />
                        {action}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
