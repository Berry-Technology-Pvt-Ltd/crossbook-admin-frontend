import axios from "axios";

export const clearAdminSession = () => {
  if (typeof window === "undefined") return;

  sessionStorage.clear();
  localStorage.removeItem("admin-token");
  localStorage.removeItem("admin-user");
};

export const adminClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// Interceptor for Master Key Bypass
adminClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const masterKey = sessionStorage.getItem("x-admin-key");
    const token =
      sessionStorage.getItem("admin-token") ||
      localStorage.getItem("admin-token");

    config.headers = config.headers || {};
    if (masterKey) {
      config.headers["x-admin-key"] = masterKey;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const isLoginRequest = requestUrl.includes("/admin/auth/login");

    if ((status === 401 || status === 403) && !isLoginRequest) {
      clearAdminSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(new Error("Admin session is no longer valid."));
    }

    return Promise.reject(error);
  },
);
