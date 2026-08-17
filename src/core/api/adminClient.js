import axios from "axios";

export const adminClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// Interceptor for Master Key Bypass
adminClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const masterKey = sessionStorage.getItem("x-admin-key");
    if (masterKey) {
      config.headers["x-admin-key"] = masterKey;
    }
  }
  return config;
});
