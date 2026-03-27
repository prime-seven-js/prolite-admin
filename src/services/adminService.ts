import api from "./api";
import type { User, Post, Stats, AppComment, ChartStats } from "@/types";

export const adminService = {
  // ─── Stats ──────────────────────────────────
  getStats: () => api.get<Stats>("/protected/admin/stats").then((r) => r.data),

  getChartStats: () =>
    api.get<ChartStats>("/protected/admin/stats/charts").then((r) => r.data),

  // ─── Users ──────────────────────────────────
  getUsers: () => api.get<User[]>("/protected/admin/users").then((r) => r.data),

  createUser: (data: { email: string; username: string; password: string; role?: string }) =>
    api.post<User>("/protected/admin/users", data).then((r) => r.data),

  updateUser: (id: string, data: Partial<Pick<User, "username" | "email" | "bio" | "avatar" | "role">>) =>
    api.put<User>(`/protected/admin/users/${id}`, data).then((r) => r.data),

  resetPassword: (id: string, newPassword: string) =>
    api.put<{ message: string }>(`/protected/admin/users/${id}/reset-password`, { newPassword }).then((r) => r.data),

  deleteUser: (id: string) =>
    api.delete(`/protected/admin/users/${id}`).then((r) => r.data),

  // ─── Posts ──────────────────────────────────
  getPosts: () => api.get<Post[]>("/protected/admin/posts").then((r) => r.data),

  deletePost: (id: string) =>
    api.delete(`/protected/admin/posts/${id}`).then((r) => r.data),

  // ─── Comments ────────────────────────────────
  getComments: () => api.get<AppComment[]>("/protected/admin/comments").then((r) => r.data),

  deleteComment: (id: string) =>
    api.delete(`/protected/admin/comments/${id}`).then((r) => r.data),
};
