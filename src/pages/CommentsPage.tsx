import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { AppComment } from "@/types";

export default function CommentsPage() {
  const [comments, setComments] = useState<AppComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AppComment | null>(null);
  const [search, setSearch] = useState("");

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await adminService.getComments();
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminService.deleteComment(deleteTarget.comment_id);
    setDeleteTarget(null);
    fetchComments();
  };

  const filteredComments = comments.filter(
    (c: AppComment) =>
      (c.content || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.users?.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.posts?.content || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Comments</h1>

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
              {filteredComments.map((comment: AppComment) => (
                <tr key={comment.comment_id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">
                    {comment.users?.username || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 max-w-40 truncate italic">
                    {comment.posts?.content || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">
                    {comment.content}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(comment)}
                      className="text-red-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
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

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Comment"
          message={`Delete comment by ${deleteTarget.users?.username || "unknown"}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
