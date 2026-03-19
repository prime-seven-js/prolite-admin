import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import type { Stats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    adminService.getStats().then(setStats).catch(console.error);
  }, []);

  const cards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: "👤" },
        { label: "Total Posts", value: stats.totalPosts, icon: "📝" },
        { label: "Total Comments", value: stats.totalComments, icon: "💬" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>

      {!stats ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="text-3xl font-bold text-white">{card.value}</div>
              <div className="text-sm text-zinc-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
