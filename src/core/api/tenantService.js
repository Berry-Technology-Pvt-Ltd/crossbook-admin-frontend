import { adminClient } from "./adminClient";

export const getTenants = async (params = {}) => {
  const response = await adminClient.get("/admin/tenants", { params });
  return response.data;
};

export const getTenantById = async (id) => {
  const response = await adminClient.get(`/admin/tenants/${id}`);
  return response.data;
};

export const createTenant = async (data) => {
  const response = await adminClient.post("/admin/tenants", data);
  return response.data;
};

// 🎯 Status සහ Renewal Date එක update කිරීම
export const updateTenantStatus = async (
  id,
  status,
  validUntil = undefined,
) => {
  const payload = { status };
  if (validUntil) payload.validUntil = validUntil;

  const response = await adminClient.patch(
    `/admin/tenants/${id}/status`,
    payload,
  );
  return response.data;
};

export const offboardTenant = async (id) => {
  const response = await adminClient.delete(`/admin/tenants/${id}`);
  return response.data;
};
