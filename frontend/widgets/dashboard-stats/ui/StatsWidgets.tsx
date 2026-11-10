"use client";

import { useId } from "react";
import type { DashboardStats } from "@/views/dashboard";
import { Card } from "@/shared/ui/card";
import { Briefcase, Users, CalendarDays, Clock } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StatsWidgetsProps extends DashboardStats {
  analytics?: import("../model/analytics").DashboardAnalytics;
  previousMonth?: DashboardStats;
  live?: boolean; candidateLabel?: string; demoActiveJobs?: boolean; demoCandidates?: boolean;
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
  const gradientId = useId();

  return (
    <div className="h-14 w-full mt-4 -mb-1">
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
  analytics,
  activeJobsCount,
  inProgressCandidates,
  todaysInterviewsCount,
  avgTimeToHire,
  live = false, candidateLabel = "Всего кандидатов", demoActiveJobs = false, demoCandidates = false,
}: StatsWidgetsProps) {
  const weeklyDelta = (trend: { date: string; value: number }[]) => {
    if (trend.length < 14) return null;
    const previous = trend.slice(-14, -7).reduce((sum, point) => sum + point.value, 0);
    const current = trend.slice(-7).reduce((sum, point) => sum + point.value, 0);
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };
  const trendBadge = (delta: number | null, lowerIsBetter = false) => {
    if (delta === null) {
      return <span aria-label="Изменение за 7 дней: нет данных" className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">N/A</span>;
    }
    const positive = lowerIsBetter ? delta <= 0 : delta >= 0;
    return (
      <span aria-label={`Изменение за 7 дней: ${delta}%`} className={`rounded-full px-2 py-0.5 text-xs font-medium ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
        {delta > 0 ? "+" : ""}{delta}%
      </span>
    );
  };
  const jobsDelta = analytics ? weeklyDelta(analytics.vacancy_trend) : null;
  const candidatesDelta = analytics ? weeklyDelta(analytics.candidate_trend) : null;
  const interviewsDelta = analytics ? weeklyDelta(analytics.interview_trend) : null;
  const hireDelta = analytics ? weeklyDelta(analytics.hire_trend) : null;
  const metric = (value: number, demoEmpty = false) =>
    demoEmpty || value === 0 ? "N/A" : value;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card icon={Briefcase} iconClassName="h-auto w-fit rounded-xl bg-blue-500/10 p-2.5 text-blue-400 group-hover:bg-blue-500/10 group-hover:scale-100" badge={trendBadge(jobsDelta)} className="p-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="text-3xl font-bold leading-none tracking-tight text-foreground">
            {metric(activeJobsCount, demoActiveJobs)}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Активные вакансии
          </div>
        </div>
        {analytics && <MiniAreaChart data={analytics.vacancy_trend.map(point => point.value)} strokeColor="#22d3ee" />}
        {!live && <MiniAreaChart data={getTrendData(activeJobsCount, null)} strokeColor="#22d3ee" />}
      </Card>

      <Card icon={Users} iconClassName="h-auto w-fit rounded-xl bg-violet-500/10 p-2.5 text-violet-400 group-hover:bg-violet-500/10 group-hover:scale-100" badge={trendBadge(candidatesDelta)} className="p-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="text-3xl font-bold leading-none tracking-tight text-foreground">
            {metric(inProgressCandidates, demoCandidates)}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            {candidateLabel}
          </div>
        </div>
        {analytics && <MiniAreaChart data={analytics.candidate_trend.map(point => point.value)} strokeColor="#a78bfa" />}
        {!live && <MiniAreaChart data={getTrendData(inProgressCandidates, null)} strokeColor="#a78bfa" />}
      </Card>

      <Card icon={CalendarDays} iconClassName="h-auto w-fit rounded-xl bg-amber-500/10 p-2.5 text-amber-400 group-hover:bg-amber-500/10 group-hover:scale-100" badge={trendBadge(interviewsDelta)} className="p-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="text-3xl font-bold leading-none tracking-tight text-foreground">
            {metric(analytics ? analytics.todays_interviews : todaysInterviewsCount)}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Назначено собеседований
          </div>
        </div>
        {analytics && <MiniAreaChart data={analytics.interview_trend.map(point => point.value)} strokeColor="#facc15" />}
        {!live && <MiniAreaChart data={getTrendData(todaysInterviewsCount, null)} strokeColor="#facc15" />}
      </Card>

      <Card icon={Clock} iconClassName="h-auto w-fit rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 group-hover:bg-emerald-500/10 group-hover:scale-100" badge={trendBadge(hireDelta, true)} className="p-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="text-3xl font-bold leading-none tracking-tight text-foreground">
            {analytics
              ? analytics.avg_time_to_hire === null || analytics.avg_time_to_hire === 0
                ? "N/A"
                : `${analytics.avg_time_to_hire} дн.`
              : avgTimeToHire === 0 ? "N/A" : `${avgTimeToHire} дн.`}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Среднее время для найма
          </div>
        </div>
        {analytics && <MiniAreaChart data={analytics.hire_trend.map(point => point.value)} strokeColor="#34d399" />}
        {!live && <MiniAreaChart data={getTrendData(avgTimeToHire, null)} strokeColor="#34d399" />}
      </Card>
    </div>
  );
}
