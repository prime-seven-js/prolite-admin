import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || "https://api.prolite.gay/";

const api = axios.create({
  baseURL: apiBaseUrl,
});

const getStoredAccessToken = () => {
  const token = localStorage.getItem("admin_token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
};

const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === "object") {
      if ("error" in data && typeof data.error === "string") {
        return data.error;
      }

      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
};

const getStoredRefreshToken = () => {
  const refreshToken = localStorage.getItem("admin_refresh_token");

  if (!refreshToken || refreshToken === "undefined" || refreshToken === "null") {
    return null;
  }

  return refreshToken;
};

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
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
      return Promise.reject(new Error(getApiErrorMessage(error)));
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error(getApiErrorMessage(error)));
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
      const res = await axios.post<{ token: string; refreshToken?: string | null }>(
        `${api.defaults.baseURL}/refresh`,
        { refreshToken },
      );

      const { token: newToken, refreshToken: newRefreshToken } = res.data;
      localStorage.setItem("admin_token", newToken);

      if (newRefreshToken) {
        localStorage.setItem("admin_refresh_token", newRefreshToken);
      } else {
        localStorage.removeItem("admin_refresh_token");
      }

      // Also update Zustand store if available
      const { useAuthStore } = await import("@/stores/useAuthStore");
      useAuthStore.getState().setTokens(newToken, newRefreshToken ?? null);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      localStorage.removeItem("admin_user");
      return Promise.reject(new Error(getApiErrorMessage(refreshError)));
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
