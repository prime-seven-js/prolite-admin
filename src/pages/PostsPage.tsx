import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/useAuthStore";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Post } from "@/types";

export default function PostsPage() {
  const adminAccess = useAuthStore((s) => s.adminAccess);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      setError("");
      const data = await adminService.getPosts(adminAccess);
      setPosts(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load posts";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      setLoading(true);
      try {
        const data = await adminService.getPosts(adminAccess);

        if (!active) {
          return;
        }

        setPosts(data);
        setError("");
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        const message = err instanceof Error ? err.message : "Failed to load posts";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      active = false;
    };
  }, [adminAccess]);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await adminService.deletePost(deleteTarget.post_id);
      setDeleteTarget(null);
      await fetchPosts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete post";
      setError(message);
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.content || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.users?.username || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Posts</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {adminAccess
            ? "Delete is enabled through backend admin post endpoints."
            : "Read-only mode. Current backend only exposes public post listing here."}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Search by title, content, or author..."
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
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium">Privacy</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr
                  key={post.post_id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">
                    {post.users?.username || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 max-w-40 truncate">
                    {post.title || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 max-w-60 truncate">
                    {post.content || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                      {post.privacy}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {adminAccess ? (
                      <button
                        onClick={() => setDeleteTarget(post)}
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
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No posts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {adminAccess && deleteTarget && (
        <ConfirmDialog
          title="Delete Post"
          message={`Delete post "${deleteTarget.title || "Untitled"}" by ${deleteTarget.users?.username || "unknown"}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
