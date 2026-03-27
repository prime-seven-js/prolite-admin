import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/useAuthStore";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { User } from "@/types";

type ModalMode = "create" | "edit" | null;
type ResetModalState = { userId: string; username: string } | null;

interface FormData {
  username: string;
  email: string;
  password: string;
  role: string;
  bio: string;
}

interface ResetPasswordForm {
  newPassword: string;
}

const EMPTY_FORM: FormData = {
  username: "",
  email: "",
  password: "",
  role: "user",
  bio: "",
};

export default function UsersPage() {
  const adminAccess = useAuthStore((s) => s.adminAccess);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<ResetModalState>(null);
  const [resetForm, setResetForm] = useState<ResetPasswordForm>({ newPassword: "" });
  const [resetError, setResetError] = useState("");
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(adminAccess);
      setUsers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setBanner({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await adminService.getUsers(adminAccess);

        if (!active) {
          return;
        }

        setUsers(data);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        const message = err instanceof Error ? err.message : "Failed to load users";
        setBanner({ type: "error", message });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [adminAccess]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalMode("create");
    setFormError("");
    setBanner(null);
  };

  const openEdit = (user: User) => {
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role ?? "user",
      bio: user.bio || "",
    });
    setEditingId(user.user_id);
    setModalMode("edit");
    setFormError("");
    setBanner(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setBanner(null);

    try {
      const isCreate = modalMode === "create";

      if (modalMode === "create") {
        if (!form.password) {
          setFormError("Password is required");
          return;
        }
        if (form.password.length < 8) {
          setFormError("Password must be at least 8 characters.");
          return;
        }
        await adminService.createUser({
          email: form.email,
          username: form.username,
          password: form.password,
          role: form.role,
        });
      } else if (modalMode === "edit" && editingId) {
        await adminService.updateUser(editingId, {
          username: form.username,
          email: form.email,
          role: form.role,
          bio: form.bio,
        });
      }
      closeModal();
      await fetchUsers();
      setBanner({
        type: "success",
        message: isCreate ? "User created successfully." : "User updated successfully.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Operation failed";
      setFormError(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await adminService.deleteUser(deleteTarget.user_id);
      setDeleteTarget(null);
      await fetchUsers();
      setBanner({ type: "success", message: "User deleted successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      setBanner({ type: "error", message });
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) {
      return;
    }

    if (!resetForm.newPassword) {
      setResetError("New password is required");
      return;
    }

    if (resetForm.newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }

    try {
      const response = await adminService.resetPassword(
        resetTarget.userId,
        resetForm.newPassword,
      );
      setResetError("");
      await fetchUsers();
      setBanner({ type: "success", message: response.message });
      setResetTarget(null);
      setResetForm({ newPassword: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setResetError(message);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {adminAccess
              ? "Full CRUD is enabled through backend admin endpoints."
              : "Read-only mode. Current backend only exposes public user listing here."}
          </p>
        </div>

        {adminAccess && (
          <button
            onClick={openCreate}
            className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            + New User
          </button>
        )}
      </div>

      {banner && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {banner.message}
        </div>
      )}

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 mb-4"
      />

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.user_id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        user.role === "admin"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {user.role ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {adminAccess ? (
                      <>
                        <button
                          onClick={() => openEdit(user)}
                          className="text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setResetTarget({ userId: user.user_id, username: user.username });
                            setResetForm({ newPassword: "" });
                            setResetError("");
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs transition-colors cursor-pointer"
                        >
                          Reset PW
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="text-red-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-600">Read only</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <h3 className="text-white font-semibold">
              {modalMode === "create" ? "Create User" : "Edit User"}
            </h3>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
                {formError}
              </div>
            )}

            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            {modalMode === "create" && (
              <input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            )}
            <select
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {modalMode === "edit" && (
              <textarea
                placeholder="Bio"
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
              />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {modalMode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete "${deleteTarget.username}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {resetTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm space-y-4"
          >
            <div>
              <h3 className="text-white font-semibold mb-2">Reset Password</h3>
              <p className="text-sm text-zinc-400">
                Set a new password for <span className="text-white">{resetTarget.username}</span>.
              </p>
            </div>

            {resetError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
                {resetError}
              </div>
            )}

            <input
              placeholder="New password"
              type="password"
              value={resetForm.newPassword}
              onChange={(e) => setResetForm({ newPassword: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setResetTarget(null);
                  setResetForm({ newPassword: "" });
                  setResetError("");
                }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Save Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
