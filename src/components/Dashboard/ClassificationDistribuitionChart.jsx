import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#facc15", "#3b82f6", "#f97316", "#14b8a6", "#a855f7", "#22c55e"];

export default function ClassificationDistribuitionChart({ data = [] }) {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  if (data.length === 0) {
    return (
      <section className="fh-card">
        <div className="fh-card-header">Distribuicao por Classificacao</div>
        <div className="fh-card-body">
          <p className="text-sm text-slate-500 dark:text-slate-400">Sem dados para exibicao.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="fh-card">
      <div className="fh-card-header">Distribuicao por Classificacao</div>
      <div className="fh-card-body h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              innerRadius={58}
              outerRadius={94}
              paddingAngle={1}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.label}-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
                color: isDark ? "#e2e8f0" : "#0f172a",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
