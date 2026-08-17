import { adminClient } from "./adminClient";

export const getUsers = async (params = {}) => {
  const response = await adminClient.get("/admin/users", { params });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await adminClient.get(`/admin/users/${id}`);
  return response.data;
};

export const createTenantUser = async (data) => {
  const response = await adminClient.post("/admin/users", data);
  return response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await adminClient.patch(`/admin/users/${id}/status`, {
    status,
  });
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await adminClient.delete(`/admin/users/${id}`);
  return response.data;
};
