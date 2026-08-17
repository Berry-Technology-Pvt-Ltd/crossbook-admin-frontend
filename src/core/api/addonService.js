import { adminClient } from "./adminClient";

export const getGlobalAddons = async () => {
  const response = await adminClient.get("/admin/addons");
  return response.data;
};

export const createAddon = async (data) => {
  const response = await adminClient.post("/admin/addons", data);
  return response.data;
};

export const assignTenantEntitlement = async (tenantId, addonSlug) => {
  const response = await adminClient.post(
    `/admin/addons/tenants/${tenantId}/entitlements`,
    {
      addonSlug,
    },
  );
  return response.data;
};

export const revokeTenantEntitlement = async (tenantId, addonSlug) => {
  const response = await adminClient.delete(
    `/admin/addons/tenants/${tenantId}/entitlements/${addonSlug}`,
  );
  return response.data;
};
