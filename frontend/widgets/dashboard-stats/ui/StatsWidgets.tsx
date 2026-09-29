"use client";

import type { DashboardStats } from "@/views/dashboard";
import { getTrendBadge } from "@/shared/ui/badges/PercentageBadge";
import { Card } from "@/shared/ui/card";
import { getDeltaPercent } from "@/shared/utils/percent";
import { Briefcase, Users, CalendarDays, Clock } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StatsWidgetsProps extends DashboardStats {
  previousMonth?: DashboardStats;
}

// Генератор данных с красивым скачком/падением в середине для наглядности графиков
function getTrendData(current: number, deltaPercent: number | null) {
  if (deltaPercent === null) return [current, current, current, current, current];
  
  const previous = current / (1 + deltaPercent / 100);
  
  // Создаем выраженный пик или спад в середине (индекс 2), чтобы график выглядел живым
  const isPositive = deltaPercent >= 0;
  const volatilityFactor = isPositive ? 0.75 : 1.25; // при росте проседаем в середине, при падении — подпрыгиваем
  const midPoint = Math.round(previous * volatilityFactor);

  return [
    Math.round(previous), 
    Math.round(previous * 0.98), 
    midPoint, 
    Math.round(current * 0.95), 
    Math.round(current)
  ];
}

// Мини-график с отступом 20px от верха
function MiniAreaChart({ data, strokeColor }: { data: number[]; strokeColor: string }) {
  const chartData = data.map((value, index) => ({ index, value }));
  const gradientId = `grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="h-18 w-full mt-5 -mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatsWidgets({
  activeJobsCount,
  inProgressCandidates,
  todaysInterviewsCount,
  avgTimeToHire,
  previousMonth,
}: StatsWidgetsProps) {
  const activeJobsDelta = previousMonth
    ? getDeltaPercent(activeJobsCount, previousMonth.activeJobsCount)
    : null;
  const candidatesDelta = previousMonth
    ? getDeltaPercent(inProgressCandidates, previousMonth.inProgressCandidates)
    : null;
  const interviewsDelta = previousMonth
    ? getDeltaPercent(
        todaysInterviewsCount,
        previousMonth.todaysInterviewsCount,
      )
    : null;
  const timeToHireDelta = previousMonth
    ? getDeltaPercent(avgTimeToHire, previousMonth.avgTimeToHire)
    : null;

  const activeJobsBadge =
    activeJobsDelta !== null
      ? getTrendBadge(
          `${activeJobsDelta > 0 ? `+${activeJobsDelta}` : activeJobsDelta}%`,
          activeJobsDelta >= 0,
        )
      : undefined;

  const candidatesBadge =
    candidatesDelta !== null
      ? getTrendBadge(
          `${candidatesDelta > 0 ? `+${candidatesDelta}` : candidatesDelta}%`,
          candidatesDelta >= 0,
        )
      : undefined;

  const interviewsBadge =
    interviewsDelta !== null
      ? getTrendBadge(
          `${interviewsDelta > 0 ? `+${interviewsDelta}` : interviewsDelta}%`,
          interviewsDelta >= 0,
        )
      : undefined;

  const timeToHireBadge =
    timeToHireDelta !== null
      ? getTrendBadge(
          `${timeToHireDelta > 0 ? `+${timeToHireDelta}` : timeToHireDelta}%`,
          timeToHireDelta <= 0,
        )
      : undefined;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card icon={Briefcase} badge={activeJobsBadge} className="p-7 pb-4">
        <div className="pl-2.5 space-y-1.5">
          <div className="text-[32px] font-bold leading-none tracking-tight">
            {activeJobsCount}
          </div>
          <div className="text-sm text-foreground-secondary font-medium">
            Активные вакансии
          </div>
        </div>
        <MiniAreaChart 
          data={getTrendData(activeJobsCount, activeJobsDelta)} 
          strokeColor="#22d3ee" 
        />
      </Card>

      <Card icon={Users} badge={candidatesBadge} className="p-7 pb-4">
        <div className="pl-2.5 space-y-1.5">
          <div className="text-[32px] font-bold leading-none tracking-tight">
            {inProgressCandidates}
          </div>
          <div className="text-sm text-foreground-secondary font-medium">
            Всего кандидатов
          </div>
        </div>
        <MiniAreaChart 
          data={getTrendData(inProgressCandidates, candidatesDelta)} 
          strokeColor="#a78bfa" 
        />
      </Card>

      <Card icon={CalendarDays} badge={interviewsBadge} className="p-7 pb-4">
        <div className="pl-2.5 space-y-1.5">
          <div className="text-[32px] font-bold leading-none tracking-tight">
            {todaysInterviewsCount}
          </div>
          <div className="text-sm text-foreground-secondary font-medium">
            Назначено собеседований
          </div>
        </div>
        <MiniAreaChart 
          data={getTrendData(todaysInterviewsCount, interviewsDelta)} 
          strokeColor="#facc15" 
        />
      </Card>

      <Card icon={Clock} badge={timeToHireBadge} className="p-7 pb-4">
        <div className="pl-2.5 space-y-1.5">
          <div className="text-[32px] font-bold leading-none tracking-tight">
            {avgTimeToHire} дн.
          </div>
          <div className="text-sm text-foreground-secondary font-medium">
            Среднее время для найма
          </div>
        </div>
        <MiniAreaChart 
          data={getTrendData(avgTimeToHire, timeToHireDelta)} 
          strokeColor="#34d399" 
        />
      </Card>
    </div>
  );
}