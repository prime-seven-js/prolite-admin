import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || "https://api.prolite.gay/";

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor — auto-refresh access token on 401.
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = originalRequest?.url || "";
    const skipUrls = ["/login", "/refresh", "/register"];
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      skipUrls.some((u) => url.includes(u))
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("admin_refresh_token");
    if (!refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post<{ token: string; refreshToken: string }>(
        `${api.defaults.baseURL}/refresh`,
        { refreshToken },
      );

      const { token: newToken, refreshToken: newRefreshToken } = res.data;
      localStorage.setItem("admin_token", newToken);
      localStorage.setItem("admin_refresh_token", newRefreshToken);

      // Also update Zustand store if available
      const { useAuthStore } = await import("@/stores/useAuthStore");
      useAuthStore.getState().setTokens(newToken, newRefreshToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      localStorage.removeItem("admin_user");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
