"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/shared/ui/card";
import { useId } from "react";

export function HiringVelocityCard({ data }: { data: { date: string; value: number }[] }) {
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const minValue = Math.min(0, ...data.map((point) => point.value));
  const maxValue = Math.max(0, ...data.map((point) => point.value));
  const yPadding = Math.max(1, (maxValue - minValue) * 0.18);
  const gradientId = useId();

  return (
    <Card className="flex min-h-[340px] flex-col p-6 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-lg font-semibold tracking-tight text-foreground">
            Динамика кандидатов
          </h3>
          <p className="mt-1 mb-0 text-sm text-muted-foreground">
            Новые кандидаты за последние 30 дней
          </p>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold leading-none tracking-tight text-foreground">
          {total || "N/A"}
        </div>
      </div>

      <div className="h-[190px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 16, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--foreground-secondary)", fontSize: 11 }}
              dy={10}
            />
            <YAxis hide domain={[minValue - yPadding, maxValue + yPadding]} />
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 4, fill: "#22d3ee", stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
