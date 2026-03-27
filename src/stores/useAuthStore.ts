import { create } from "zustand";
import api from "@/services/api";
import type { AuthState } from "@/types";

const getStoredValue = (key: string) => {
  const value = localStorage.getItem(key);

  if (!value || value === "undefined" || value === "null") {
    return null;
  }

  return value;
};

const getStoredUser = () => {
  const rawUser = localStorage.getItem("admin_user");

  if (!rawUser || rawUser === "undefined" || rawUser === "null") {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem("admin_user");
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredValue("admin_token"),
  refreshToken: getStoredValue("admin_refresh_token"),
  user: getStoredUser(),

  login: async (email, password) => {
    const { data } = await api.post<{
      token: string;
      refreshToken?: string | null;
      user: { userId: string; email: string; username: string; role: string };
    }>("/login", { email: email.trim().toLowerCase(), password });

    if (data.user.role !== "admin") {
      throw new Error("Access denied: admin only");
    }

    localStorage.setItem("admin_token", data.token);

    if (data.refreshToken) {
      localStorage.setItem("admin_refresh_token", data.refreshToken);
    } else {
      localStorage.removeItem("admin_refresh_token");
    }

    localStorage.setItem("admin_user", JSON.stringify(data.user));
    set({
      token: data.token,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    });
  },

  logout: () => {
    // Try to call backend logout, ignore errors
    const token = get().token;
    if (token) {
      api.post("/protected/logout").catch(() => {});
    }
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    set({ token: null, refreshToken: null, user: null });
  },

  setTokens: (token, refreshToken = null) => {
    localStorage.setItem("admin_token", token);

    if (refreshToken) {
      localStorage.setItem("admin_refresh_token", refreshToken);
    } else {
      localStorage.removeItem("admin_refresh_token");
    }

    set({ token, refreshToken });
  },
}));
