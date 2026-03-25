import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import AdminLayout from "@/layouts/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import PostsPage from "@/pages/PostsPage";
import CommentsPage from "@/pages/CommentsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="comments" element={<CommentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
