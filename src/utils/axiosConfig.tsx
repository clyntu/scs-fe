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

// Helper function to ensure we always have a company ID
export function getCompanyId(): string {
  // Try multiple sources in order of preference
  const fromCookie = getCookie("company_id");
  const fromLocalStorage = localStorage.getItem("companyId");

  // Log for debugging
  console.log("Company ID sources:", {
    fromCookie,
    fromLocalStorage,
    allCookies: typeof document !== "undefined" ? document.cookie : "N/A",
  });

  return fromCookie || fromLocalStorage || "company-a"; // Fallback to default
}

// Only register these in the browser
if (typeof window !== "undefined") {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Always get a fresh company ID for each request
      const companyId = getCompanyId();

      // Ensure headers object exists
      config.headers = config.headers || {};

      // Always send with credentials
      config.withCredentials = true;

      // Always set company ID header
      config.headers["X-Company-ID"] = companyId;

      // Check for access token cookie
      const accessToken = getCookie("access_token");
      if (accessToken) {
        // Even though the cookie should be sent automatically with withCredentials,
        // let's also set the Authorization header as a fallback
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // Only redirect to login if not already on login or register page
      if (
        !companyId &&
        window.location.pathname !== "/" &&
        window.location.pathname !== "/register"
      ) {
        console.error("No company ID found, redirecting to login");
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
        console.error("Authentication failed, redirecting to login");
        window.location.href = "/";
      } else if (status === 403) {
        const msg =
          error.response?.data?.detail ||
          "You don't have permission to access this resource";
        window.location.href = `/forbidden?message=${encodeURIComponent(msg)}`;
      } else if (
        status === 400 &&
        error.response?.data?.detail?.includes("X-Company-ID") &&
        path !== "/"
      ) {
        console.error("Invalid or missing company ID, redirecting to login");
        window.location.href = "/";
      }

      return Promise.reject(error);
    },
  );
}

export default axiosInstance;
