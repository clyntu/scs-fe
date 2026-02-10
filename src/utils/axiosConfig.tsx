// utils/axiosConfig.tsx
import { SupabaseClient } from "@supabase/supabase-js";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { getSupabase } from "../supabase/supabaseClient";

// Type definitions
type CompanyId = "company-a" | "company-b";
type RefreshSubscriber = (token: string) => void;

// State management for token refresh
let isRefreshing = false;
let refreshSubscribers: RefreshSubscriber[] = [];

// Helper function to get cookie value
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// Get company ID from various sources with fallback
export function getCompanyId(): string {
  if (typeof window === "undefined") return "company-a";

  // Check new company context first, then fallback to legacy
  const fromNewContext = window.localStorage.getItem("currentCompany");
  const fromCookie = getCookie("company_id");
  const fromLegacyStorage = window.localStorage.getItem("companyId");

  return fromNewContext || fromCookie || fromLegacyStorage || "company-a";
}

// Create a queue for failed requests
function subscribeTokenRefresh(callback: RefreshSubscriber) {
  refreshSubscribers.push(callback);
}

// Process the queue with a new token
function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

// Handle token refresh with error handling
async function refreshAuthToken(
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error("Token refresh failed:", error);

      // Handle permanent auth failures
      if (error.message?.includes("expired") || error.status === 400) {
        await supabase.auth.signOut();
        const companyId = getCompanyId();
        localStorage.removeItem(`sb-${companyId}-auth-token`);
        return null;
      }

      return null;
    }

    if (data?.session?.access_token) {
      return data.session.access_token;
    }

    return null;
  } catch (e) {
    console.error("Exception during token refresh:", e);
    return null;
  }
}

// Configure the Axios instance
export function setupAxiosInterceptors(axiosInstance: typeof axios) {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    async (config) => {
      // Skip if running on server
      if (typeof window === "undefined") return config;

      // Always get a fresh company ID
      const companyId = getCompanyId() as CompanyId;
      const supabase = getSupabase(); // Single Supabase instance

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${session.access_token}`,
          };
        }

        // Set company ID header
        config.headers["X-Company-ID"] = companyId;

        // Set credentials for cookies
        config.withCredentials = true;

        return config;
      } catch (e) {
        console.error("Error in request interceptor:", e);

        // If we're not on login or register, redirect there
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/" &&
          window.location.pathname !== "/register"
        ) {
          window.location.href = "/";
          throw new Error("Authentication failed");
        }

        return config;
      }
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor for handling authentication issues
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // Only handle in browser context
      if (typeof window === "undefined") return Promise.reject(error);

      const status = error.response?.status;
      const path = window.location.pathname;
      const companyId = getCompanyId() as CompanyId;

      // Check for network issues
      if (!navigator.onLine) {
        localStorage.setItem("auth_retry_needed", "true");
        return Promise.reject({
          ...error,
          isOffline: true,
          message: "You appear to be offline. Please check your connection.",
        });
      }

      // Check if server is unreachable
      if (!error.response && error.request) {
        return Promise.reject({
          ...error,
          isServerDown: true,
          message: "Server is currently unavailable. Please try again later.",
        });
      }

      // Handle timeouts
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };
        if (!originalRequest._retry) {
          originalRequest._retry = true;

          // Get a fresh token
          const supabase = getSupabase();
          const { data } = await supabase.auth.getSession();

          if (data?.session) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers["Authorization"] =
              `Bearer ${data.session.access_token}`;
          }

          return axiosInstance(originalRequest);
        }
      }

      // Handle 401 Unauthorized errors
      if (status === 401 && path !== "/" && path !== "/register") {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retryCount?: number;
        };

        // Limit retries to avoid infinite loops
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        if (originalRequest._retryCount > 3) {
          console.error("Max retry attempts reached for request");
          window.location.href = "/?maxRetry=true";
          return Promise.reject(error);
        }

        // Handle token refresh
        if (!isRefreshing) {
          isRefreshing = true;

          const supabase = getSupabase();
          const newToken = await refreshAuthToken(supabase);

          isRefreshing = false;

          if (newToken) {
            // Notify all subscribers about the new token
            onTokenRefreshed(newToken);

            // Retry the original request
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } else {
            // Token refresh failed - redirect to login
            console.error("Session refresh failed, redirecting to login");
            window.location.href = "/";
            return Promise.reject(error);
          }
        } else {
          // Wait for the token refresh, then retry
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
              resolve(axiosInstance(originalRequest));
            });
          });
        }
      }
      // Handle 403 Forbidden
      else if (status === 403) {
        const msg =
          error.response?.data?.detail ||
          "You don't have permission to access this resource";
        window.location.href = `/forbidden?message=${encodeURIComponent(msg)}`;
      }
      // Handle 400 Bad Request for disabled/inactive users
      else if (
        status === 400 &&
        typeof error.response?.data?.detail === "string" &&
        (error.response?.data?.detail.toLowerCase().includes("inactive user") ||
          error.response?.data?.detail.toLowerCase().includes("disabled")) &&
        path !== "/"
      ) {
        console.error("User account is disabled, signing out");

        // Sign out from Supabase
        const supabase = getSupabase();
        void supabase.auth.signOut();

        // Redirect to login with error message
        window.location.href = "/?error=disabled";
      }
      // Handle 400 Bad Request related to Company ID
      else if (
        status === 400 &&
        typeof error.response?.data?.detail === "string" &&
        error.response?.data?.detail.includes("X-Company-ID") &&
        path !== "/"
      ) {
        console.error("Invalid or missing company ID, redirecting to login");
        window.location.href = "/";
      }

      return Promise.reject(error);
    },
  );

  // Add listener for browser going online
  if (typeof window !== "undefined") {
    window.addEventListener("online", async () => {
      if (localStorage.getItem("auth_retry_needed") === "true") {
        localStorage.removeItem("auth_retry_needed");

        // Get fresh tokens
        const supabase = getSupabase();
        await supabase.auth.refreshSession();

        // Reload page to restore functionality
        window.location.reload();
      }
    });

    // Add listener for storage events (for multi-tab support)
    window.addEventListener("storage", (event) => {
      if (event.key?.includes("supabase.auth.token")) {
        // Force refresh of auth state in this tab
        const supabase = getSupabase();
        supabase.auth.getSession(); // This will update the in-memory session
      }
    });
  }
}

// Export a configured axios instance
export function createAuthenticatedAxios() {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    withCredentials: true,
    timeout: 200000, // 60 second timeout
  });

  setupAxiosInterceptors(axiosInstance);

  return axiosInstance;
}

// Export a singleton instance
const axiosInstance = createAuthenticatedAxios();
export default axiosInstance;
