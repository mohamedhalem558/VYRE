import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Bearer Access Token to every request if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vyre_access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with auto-refresh mechanism
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retried, try to refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/login") &&
      !originalRequest?.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("vyre_refresh_token");

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          if (res.data?.success && res.data?.data?.tokens?.accessToken) {
            const newAccessToken = res.data.data.tokens.accessToken;
            const newRefreshToken = res.data.data.tokens.refreshToken;

            localStorage.setItem("vyre_access_token", newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem("vyre_refresh_token", newRefreshToken);
            }

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (_refreshErr) {
          // Refresh failed - clear stale tokens
          localStorage.removeItem("vyre_access_token");
          localStorage.removeItem("vyre_refresh_token");
        }
      }
    }

    if (import.meta.env.DEV) {
      console.warn("[API Client] Error response:", error?.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);
