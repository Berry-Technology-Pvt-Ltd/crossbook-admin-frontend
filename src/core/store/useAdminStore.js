import { create } from "zustand";
import { adminClient, clearAdminSession } from "../api/adminClient";

export const useAdminAuthStore = create((set) => ({
  adminUser: null,
  isAuthenticated: false,
  isLoading: true,

  // 1. System Admin Login Action
  loginAdmin: async (email, password) => {
    try {
      const response = await adminClient.post("/admin/auth/login", {
        email,
        password,
      });
      set({ adminUser: response.data.user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Admin Login Failed",
      };
    }
  },

  // 2. Re-hydrate Profile Action (/me)
  fetchAdminProfile: async () => {
    try {
      set({ isLoading: true });
      const response = await adminClient.get("/admin/auth/me");
      set({
        adminUser: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      clearAdminSession();
      set({ adminUser: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  // 3. Admin Logout Action
  logoutAdmin: async () => {
    try {
      await adminClient.post("/admin/auth/logout");
    } finally {
      clearAdminSession();
      set({ adminUser: null, isAuthenticated: false });
    }
  },

  clearAuth: () => {
    clearAdminSession();
    set({ adminUser: null, isAuthenticated: false, isLoading: false });
  },
}));
