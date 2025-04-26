// utils/axiosConfig.tsx
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true, // Important for cookies
});

// Helper function to get cookie value (for client-side readable cookies)
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// Only register these in the browser
if (typeof window !== "undefined") {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      const companyId = getCookie("company_id");
      // Ensure headers object exists
      config.headers = config.headers || {};

      if (companyId) {
        config.headers["X-Company-ID"] = companyId;
      } else if (
        window.location.pathname !== "/" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/";
        throw new Error("Company ID not found");
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const path = window.location.pathname;

      if (status === 401 && path !== "/") {
        window.location.href = "/";
      } else if (status === 403) {
        const msg =
          error.response.data.detail ||
          "You don't have permission to access this resource";
        window.location.href = `/forbidden?message=${encodeURIComponent(msg)}`;
      } else if (
        status === 400 &&
        error.response.data?.detail?.includes("X-Company-ID") &&
        path !== "/"
      ) {
        window.location.href = "/";
      }

      return Promise.reject(error);
    },
  );
}

export default axiosInstance;
