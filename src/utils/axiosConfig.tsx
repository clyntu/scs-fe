// utils/axiosConfig.tsx
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true, // Important for cookies
});

// Add a request interceptor to set the Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add a response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call your refresh token endpoint
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/refresh`,
          {},
          { withCredentials: true }, // Important to include cookies
        );

        const { access_token } = response.data;

        // Update stored token
        localStorage.setItem("accessToken", access_token);

        // Update Authorization header and retry
        axios.defaults.headers.common["Authorization"] =
          `Bearer ${access_token}`;
        originalRequest.headers["Authorization"] = `Bearer ${access_token}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem("accessToken");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      // Get the error message from the response
      const errorMessage =
        error.response.data.detail ||
        "You don't have permission to access this resource";

      // Redirect to forbidden page with error message
      window.location.href = `/forbidden?message=${encodeURIComponent(errorMessage)}`;
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
