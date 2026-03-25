import { create } from "zustand";
import api from "@/services/api";
import type { AuthState } from "@/types";

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("admin_token"),
  refreshToken: localStorage.getItem("admin_refresh_token"),
  user: JSON.parse(localStorage.getItem("admin_user") || "null"),

  login: async (email, password) => {
    const { data } = await api.post("/login", { email, password });

    if (data.user.role !== "admin") {
      throw new Error("Access denied: admin only");
    }

    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("admin_refresh_token", data.refreshToken);
    localStorage.setItem("admin_user", JSON.stringify(data.user));
    set({ token: data.token, refreshToken: data.refreshToken, user: data.user });
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

  setTokens: (token, refreshToken) => {
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_refresh_token", refreshToken);
    set({ token, refreshToken });
  },
}));
