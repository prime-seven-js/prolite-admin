export interface User {
  user_id: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  created_at: string;
}

export interface Post {
  post_id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  privacy: string;
  created_at: string;
  users: { username: string; avatar: string | null } | null;
}

export interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  postsByPrivacy: Array<{ label: string; value: number }>;
  postsByDate: Array<{ date: string; count: number }>;
}

export interface ChartStats {
  postsByPrivacy: Array<{ label: string; value: number }>;
  postsByDate: Array<{ date: string; count: number }>;
}

export interface AppComment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users?: { username: string; avatar: string | null } | null;
  posts?: { content: string } | null;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: { userId: string; email: string; username: string; role: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (token: string, refreshToken?: string | null) => void;
}
