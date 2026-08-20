// src/core/api/userService.js
import { adminClient } from "./adminClient";

/**
 * Fetch paginated global users with memberships and roles.
 */
export const getUsers = async (params = {}) => {
  const response = await adminClient.get("/admin/users", { params });
  return response.data;
};

/**
 * Fetch single user profile by ID with all workspace memberships.
 */
export const getUserById = async (id) => {
  const response = await adminClient.get(`/admin/users/${id}`);
  return response.data;
};

/**
 * Provision a new global user or link to an initial workspace.
 */
export const createTenantUser = async (data) => {
  const response = await adminClient.post("/admin/users", data);
  return response.data;
};

/**
 * Assign an existing user identity to an additional workspace.
 */
export const assignUserToTenant = async (data) => {
  const response = await adminClient.post("/admin/users/assign-tenant", data);
  return response.data;
};

/**
 * Update global account status (ACTIVE, SUSPENDED, INACTIVE).
 */
export const updateUserStatus = async (id, status) => {
  const response = await adminClient.patch(`/admin/users/${id}/status`, {
    status,
  });
  return response.data;
};

/**
 * Revoke a user's membership from a specific workspace.
 */
export const revokeMembership = async (membershipId) => {
  const response = await adminClient.delete(
    `/admin/users/memberships/${membershipId}`,
  );
  return response.data;
};

/**
 * Deactivate global user account across all workspaces.
 */
export const deactivateUser = async (id) => {
  const response = await adminClient.delete(`/admin/users/${id}`);
  return response.data;
};
