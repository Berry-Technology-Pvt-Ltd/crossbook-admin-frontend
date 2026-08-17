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

export const updateTenantStatus = async (id, status) => {
  const response = await adminClient.patch(`/admin/tenants/${id}/status`, {
    status,
  });
  return response.data;
};

export const offboardTenant = async (id) => {
  const response = await adminClient.delete(`/admin/tenants/${id}`);
  return response.data;
};
