import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/users", label: "Users", icon: "👤" },
  { to: "/posts", label: "Posts", icon: "📝" },
  { to: "/comments", label: "Comments", icon: "💬" },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-800 flex flex-col">
        <div className="px-5 py-5 text-lg font-black tracking-wider text-white">
          PROLITE <span className="text-xs font-normal text-zinc-500">admin</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-zinc-400 hover:text-red-400 transition-colors text-left cursor-pointer"
          >
            ← Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
