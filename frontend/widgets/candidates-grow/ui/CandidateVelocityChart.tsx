"use client";

import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";
import { Card } from "@/shared/ui/card";

export function HiringVelocityCard({ data }: { data: { date: string; value: number }[] }) {
  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight m-0">
            Динамика кандидатов
          </h3>
          <p className="text-sm text-foreground-secondary mt-0.5 mb-0">
            Новые кандидаты за последние 30 дней{" "}
          </p>
        </div>

      </div>

      <div className="mb-6">
        <div className="text-[40px] font-bold leading-none tracking-tight text-foreground">
          {total}
        </div>

      </div>

      <div className="h-55 w-full -mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--cyan-main)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--cyan-main)"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--foreground-secondary)", fontSize: 11 }}
              dy={10}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--cyan-main)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#velocityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
