import { adminClient } from "./adminClient";

export const getAuditLogs = async (params = {}) => {
  const { tenantId, action, page = 1, limit = 20 } = params;
  const res = await adminClient.get("/admin/audit-logs", {
    params: { tenantId, action, page, limit },
  });
  return res.data?.data || res.data;
};
