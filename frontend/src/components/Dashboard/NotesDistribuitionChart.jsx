import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function NotesDistribuitionChart({ data = [] }) {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <section className="fh-card">
      <div className="fh-card-header">Distribuicao por Nota</div>
      <div className="fh-card-body h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid
              strokeDasharray="2 3"
              vertical={false}
              stroke={isDark ? "#334155" : "#e2e8f0"}
            />
            <XAxis dataKey="label" tick={{ fill: isDark ? "#cbd5e1" : "#64748b", fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: isDark ? "#cbd5e1" : "#64748b", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: isDark ? "#0f172a" : "#f8fafc" }}
              contentStyle={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
                color: isDark ? "#e2e8f0" : "#0f172a",
              }}
            />
            <Bar dataKey="total" fill="url(#noteGradient)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="noteGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#a7f3d0" stopOpacity={0.9} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
