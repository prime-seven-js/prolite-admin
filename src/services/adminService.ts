import api from "./api";
import type { User, Post, Stats, AppComment, ChartStats } from "@/types";

type DashboardData = {
  stats: Stats;
  chartStats: ChartStats;
};

type RawUser = Omit<User, "role"> & { role?: string | null };

type RawComment = {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

const PUBLIC_PAGE_SIZE = 1000;
const COMMENT_PAGE_SIZE = 100;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeUser = (user: RawUser): User => ({
  user_id: user.user_id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  role: user.role ?? null,
  created_at: user.created_at,
});

const fetchAllPublicUsers = async (): Promise<User[]> => {
  const users: User[] = [];
  let page = 1;

  while (true) {
    const batch = await api
      .get<RawUser[]>("/users", {
        params: { page, limit: PUBLIC_PAGE_SIZE },
      })
      .then((r) => r.data.map(normalizeUser));

    users.push(...batch);

    if (batch.length < PUBLIC_PAGE_SIZE) {
      return users;
    }

    page += 1;
  }
};

const fetchAllPublicPosts = async (): Promise<Post[]> => {
  const posts: Post[] = [];
  let page = 1;

  while (true) {
    const batch = await api
      .get<Post[]>("/posts", {
        params: { page, limit: PUBLIC_PAGE_SIZE },
      })
      .then((r) => r.data);

    posts.push(...batch);

    if (batch.length < PUBLIC_PAGE_SIZE) {
      return posts;
    }

    page += 1;
  }
};

const fetchAllCommentsForPost = async (postId: string): Promise<RawComment[]> => {
  const comments: RawComment[] = [];
  let page = 1;

  while (true) {
    const batch = await api
      .get<RawComment[]>(`/posts/${postId}/comments`, {
        params: { page, limit: COMMENT_PAGE_SIZE },
      })
      .then((r) => r.data);

    comments.push(...batch);

    if (batch.length < COMMENT_PAGE_SIZE) {
      return comments;
    }

    page += 1;
  }
};

const buildChartStats = (posts: Post[]): ChartStats => {
  const postsByPrivacyMap = new Map<string, number>();

  for (const post of posts) {
    const privacy = post.privacy || "unknown";
    postsByPrivacyMap.set(privacy, (postsByPrivacyMap.get(privacy) ?? 0) + 1);
  }

  const today = new Date();
  const postsByDate = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * DAY_IN_MS)
      .toISOString()
      .slice(0, 10);

    return { date, count: 0 };
  });

  const postsByDateMap = new Map(postsByDate.map((entry) => [entry.date, entry]));

  for (const post of posts) {
    const createdDate = new Date(post.created_at).toISOString().slice(0, 10);
    const entry = postsByDateMap.get(createdDate);

    if (entry) {
      entry.count += 1;
    }
  }

  return {
    postsByPrivacy: Array.from(postsByPrivacyMap.entries()).map(([label, value]) => ({
      label,
      value,
    })),
    postsByDate,
  };
};

const getReadableComments = async (): Promise<AppComment[]> => {
  const [posts, users] = await Promise.all([fetchAllPublicPosts(), fetchAllPublicUsers()]);
  const userLookup = new Map(users.map((user) => [user.user_id, user]));

  const commentGroups = await Promise.all(
    posts.map(async (post) => {
      const comments = await fetchAllCommentsForPost(post.post_id);

      return comments.map((comment) => ({
        ...comment,
        users: userLookup.has(comment.user_id)
          ? {
              username: userLookup.get(comment.user_id)?.username ?? "Unknown",
              avatar: userLookup.get(comment.user_id)?.avatar ?? null,
            }
          : null,
        posts: {
          content: post.content ?? "",
        },
      }));
    }),
  );

  return commentGroups
    .flat()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const adminService = {
  checkAdminAccess: async () => {
    try {
      await api.get("/protected/admin/stats");
      return true;
    } catch {
      return false;
    }
  },

  getDashboard: async (adminAccess: boolean): Promise<DashboardData> => {
    if (adminAccess) {
      const [baseStats, posts] = await Promise.all([
        api.get<Pick<Stats, "totalUsers" | "totalPosts" | "totalComments">>(
          "/protected/admin/stats",
        ).then((r) => r.data),
        api.get<Post[]>("/protected/admin/posts").then((r) => r.data),
      ]);

      const chartStats = buildChartStats(posts);

      return {
        stats: {
          ...baseStats,
          ...chartStats,
        },
        chartStats,
      };
    }

    const [users, posts, comments] = await Promise.all([
      fetchAllPublicUsers(),
      fetchAllPublicPosts(),
      getReadableComments(),
    ]);
    const chartStats = buildChartStats(posts);

    return {
      stats: {
        totalUsers: users.length,
        totalPosts: posts.length,
        totalComments: comments.length,
        ...chartStats,
      },
      chartStats,
    };
  },

  getUsers: (adminAccess: boolean) =>
    adminAccess
      ? api.get<User[]>("/protected/admin/users").then((r) => r.data.map(normalizeUser))
      : fetchAllPublicUsers(),

  createUser: (data: {
    email: string;
    username: string;
    password: string;
    role?: string;
  }) => api.post<User>("/protected/admin/users", data).then((r) => normalizeUser(r.data)),

  updateUser: (
    id: string,
    data: Partial<Pick<User, "username" | "email" | "bio" | "avatar" | "role">>,
  ) => api.put<User>(`/protected/admin/users/${id}`, data).then((r) => normalizeUser(r.data)),

  resetPassword: (id: string, newPassword: string) =>
    api
      .put<{ message: string }>(`/protected/admin/users/${id}/password`, {
        newPassword,
      })
      .then((r) => r.data),

  deleteUser: (id: string) => api.delete(`/protected/admin/users/${id}`).then((r) => r.data),

  getPosts: (adminAccess: boolean) =>
    adminAccess
      ? api.get<Post[]>("/protected/admin/posts").then((r) => r.data)
      : fetchAllPublicPosts(),

  deletePost: (id: string) => api.delete(`/protected/admin/posts/${id}`).then((r) => r.data),

  getComments: (adminAccess: boolean) =>
    adminAccess
      ? api.get<AppComment[]>("/protected/admin/comments").then((r) => r.data)
      : getReadableComments(),

  deleteComment: (id: string) =>
    api.delete(`/protected/admin/comments/${id}`).then((r) => r.data),
};
