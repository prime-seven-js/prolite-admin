import { create } from "zustand";
import api from "@/services/api";
import type { AuthState } from "@/types";

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("admin_token"),
  user: JSON.parse(localStorage.getItem("admin_user") || "null"),

  login: async (email, password) => {
    const { data } = await api.post("/login", { email, password });

    if (data.user.role !== "admin") {
      throw new Error("Access denied: admin only");
    }

    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("admin_user", JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    set({ token: null, user: null });
  },
}));
