"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { chartdata } from "../model/chartData";
import { Card } from "@/shared/ui/Card";

const ACCENT = "#007aff";

export default function CandidateGrowChart() {
  return (
    <Card className="h-96 rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">
        Динамика притока кандидатов
      </h3>
      <p className="mb-4 text-sm text-gray-400">За последние месяцы</p>

      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={chartdata} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="candidateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="#F1F1F4" />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            width={32}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }} />

          <Area
            type="monotone"
            dataKey="Кандидаты"
            stroke={ACCENT}
            strokeWidth={2.5}
            fill="url(#candidateFill)"
            activeDot={{ r: 5, fill: ACCENT, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {payload[0].value} кандидатов
      </p>
    </div>
  );
}