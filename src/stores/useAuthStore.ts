import { create } from "zustand";
import api from "@/services/api";
import { adminService } from "@/services/adminService";
import type { AuthState } from "@/types";

const getStoredValue = (key: string) => {
  const value = localStorage.getItem(key);

  if (!value || value === "undefined" || value === "null") {
    return null;
  }

  return value;
};

const getStoredBoolean = (key: string) => localStorage.getItem(key) === "true";

const getStoredUser = () => {
  const rawUser = localStorage.getItem("admin_user");

  if (!rawUser || rawUser === "undefined" || rawUser === "null") {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthState["user"];
  } catch {
    localStorage.removeItem("admin_user");
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getStoredValue("admin_token"),
  adminAccess: getStoredBoolean("admin_access"),
  user: getStoredUser(),

  login: async (email, password) => {
    const { data } = await api.post<{
      token: string;
      user: { userId: string; email: string; username: string; role?: string | null };
    }>("/login", { email: email.trim().toLowerCase(), password });

    if (data.user.role && data.user.role !== "admin") {
      throw new Error("Access denied: admin only");
    }

    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("admin_user", JSON.stringify(data.user));

    const adminAccess = await adminService.checkAdminAccess();

    localStorage.setItem("admin_access", String(adminAccess));
    localStorage.removeItem("admin_refresh_token");

    set({
      token: data.token,
      adminAccess,
      user: data.user,
    });
  },

  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_access");
    set({ token: null, adminAccess: false, user: null });
  },
}));
