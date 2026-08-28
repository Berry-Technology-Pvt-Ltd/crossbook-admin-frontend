export const SYSTEM_MODULES = {
  vouchers: {
    key: "vouchers",
    label: "Voucher & Expense",
    actions: ["read", "create", "approve", "print", "reprint", "void"],
  },
  checks: {
    key: "checks",
    label: "Check Orchestrator",
    actions: ["read", "create", "print", "reprint", "manage_templates"],
  },
  invoices: {
    key: "invoices",
    label: "Invoice Suite",
    actions: ["read", "sync", "print", "reprint", "manage_settings"],
  },
  settings: {
    key: "settings",
    label: "Workspace Administration",
    actions: ["manage", "users_manage", "qbo_manage"],
  },
};
