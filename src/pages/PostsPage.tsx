import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Post } from "@/types";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [search, setSearch] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminService.deletePost(deleteTarget.post_id);
    setDeleteTarget(null);
    fetchPosts();
  };

  const filteredPosts = posts.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.content || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.users?.username || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Posts</h1>

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
                <tr key={post.post_id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
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
                    <button
                      onClick={() => setDeleteTarget(post)}
                      className="text-red-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
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

      {deleteTarget && (
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
