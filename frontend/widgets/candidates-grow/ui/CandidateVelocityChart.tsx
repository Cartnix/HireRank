"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";
import { Card } from "@/shared/ui/card";
import { hiringVelocityMockData } from "../model/Velocity.mock.";

export function HiringVelocityCard() {
  const [period, setPeriod] = useState<string>("30 дн");

  const currentData =
    hiringVelocityMockData[period] || hiringVelocityMockData["30 дн"];

  return (
    <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight m-0">
            Скорость найма
          </h3>
          <p className="text-sm text-foreground-secondary mt-0.5 mb-0">
            Кандидаты, проходящие через академическую воронку{" "}
          </p>
        </div>

        <div className="flex bg-secondary p-1 rounded-lg border border-border text-xs">
          {Object.keys(hiringVelocityMockData).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                period === p
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-[40px] font-bold leading-none tracking-tight text-foreground">
          {currentData.total}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-md">
            ↗ {currentData.delta}
          </span>
          <span className="text-xs text-foreground-secondary">
            к прошлому периоду{" "}
          </span>
        </div>
      </div>

      <div className="h-55 w-full -mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={currentData.chartData}
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
