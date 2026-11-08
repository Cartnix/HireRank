"use client";

import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/shared/ui/card";

export function HiringVelocityCard({ data }: { data: { date: string; value: number }[] }) {
  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <Card className="flex min-h-[340px] flex-col bg-[#0e1726]/80 p-6 border-white/[0.08] shadow-none">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-lg font-semibold tracking-tight text-white">
            Динамика кандидатов
          </h3>
          <p className="mt-1 mb-0 text-sm text-slate-400">
            Новые кандидаты за последние 30 дней
          </p>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold leading-none tracking-tight text-white">
          {total || "N/A"}
        </div>
      </div>

      <div className="h-[190px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--foreground-secondary)", fontSize: 11 }}
              dy={10}
            />
            <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="3 4" />
            <Tooltip
              contentStyle={{ background: "#0b121e", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, color: "#e2e8f0" }}
              labelStyle={{ color: "#94a3b8" }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "#22d3ee", stroke: "#0e1726", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
