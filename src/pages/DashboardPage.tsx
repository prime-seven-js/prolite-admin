import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import type { Stats } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<{ postsByPrivacy: any[]; postsByDate: any[] } | null>(null);

  useEffect(() => {
    adminService.getStats().then(setStats).catch(console.error);
    adminService.getChartStats().then(setChartData).catch(console.error);
  }, []);

  const cards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: "👤" },
        { label: "Total Posts", value: stats.totalPosts, icon: "📝" },
        { label: "Total Comments", value: stats.totalComments, icon: "💬" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-6">Dashboard</h1>
        {!stats ? (
          <p className="text-zinc-500 text-sm">Loading stats...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="text-3xl font-bold text-white">{card.value}</div>
                <div className="text-sm text-zinc-500 mt-1">{card.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Posts by Date */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-6">Posts in last 7 days</h2>
          <div className="h-64 w-full">
            {!chartData ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-600 text-xs">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.postsByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickFormatter={(str) => str.split('-').slice(1).join('/')}
                  />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Posts by Privacy */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-6">Privacy Distribution</h2>
          <div className="h-64 w-full">
            {!chartData ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-600 text-xs">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.postsByPrivacy}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="label"
                  >
                    {chartData.postsByPrivacy.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
