import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/useAuthStore";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { AppComment } from "@/types";

export default function CommentsPage() {
  const adminAccess = useAuthStore((s) => s.adminAccess);
  const [comments, setComments] = useState<AppComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AppComment | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      setError("");
      const data = await adminService.getComments(adminAccess);
      setComments(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load comments";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [adminAccess]);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await adminService.deleteComment(deleteTarget.comment_id);
      setDeleteTarget(null);
      await fetchComments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete comment";
      setError(message);
    }
  };

  const filteredComments = comments.filter(
    (comment) =>
      (comment.content || "").toLowerCase().includes(search.toLowerCase()) ||
      (comment.users?.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (comment.posts?.content || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Comments</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {adminAccess
            ? "Delete is enabled through backend admin comment endpoints."
            : "Read-only mode. Current backend only exposes public comment reads here."}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Search comments, authors, or post content..."
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
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Post Context</th>
                <th className="px-4 py-3 font-medium">Comment</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.map((comment) => (
                <tr
                  key={comment.comment_id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">
                    {comment.users?.username || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 max-w-40 truncate italic">
                    {comment.posts?.content || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">{comment.content}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {adminAccess ? (
                      <button
                        onClick={() => setDeleteTarget(comment)}
                        className="text-red-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-600">Read only</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredComments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No comments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {adminAccess && deleteTarget && (
        <ConfirmDialog
          title="Delete Comment"
          message={`Delete comment from ${deleteTarget.users?.username || "unknown"}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
