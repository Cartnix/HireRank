"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card } from "@/shared/ui/card";
import { HiringVelocityCard } from "@/widgets/candidates-grow/ui/CandidateVelocityChart";
import { HiringFunnelCard } from "@/widgets/candidate-funnel";
import { TopCandidatesCard } from "@/widgets/top-candidate";
import { UpcomingInterviewsCard } from "@/widgets/upcoming-interviews/ui/UpcomingInterviewsCard";
import type { DashboardAnalytics } from "@/widgets/dashboard-stats/model/analytics";

const colors = ["#22d3ee", "#a78bfa", "#34d399", "#facc15", "#fb7185"];
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("");

export function AnalyticsOverview({ data, candidateLink }: { data: DashboardAnalytics; candidateLink?: (id: string) => string }) {
  const max = Math.max(1, ...data.pipeline.map(stage => stage.count));
  return <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <HiringVelocityCard data={data.candidate_trend} />
      <HiringFunnelCard stages={data.pipeline.map((stage, index) => ({ id: String(index), name: stage.stage, count: stage.count, percentage: stage.count / max * 100, colorClass: "bg-cyan-main" }))} />
    </div>
    <Card className="p-6">
      <h3 className="text-lg font-semibold">Источники кандидатов</h3>
      {data.sources.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.sources} dataKey="count" nameKey="stage" innerRadius={50} outerRadius={85}>{data.sources.map((source, index) => <Cell key={source.stage} fill={colors[index % colors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div> : <p>Нет данных об источниках</p>}
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TopCandidatesCard candidateLink={candidateLink} candidates={data.top_candidates.map(c => ({ id: c.id, name: c.name, position: c.position, stage: c.stage, rating: c.rating, initials: initials(c.name), stageColorClass: "bg-cyan-main/10 text-cyan-main border-cyan-main/20" }))} />
      <UpcomingInterviewsCard todayCount={data.todays_interviews} interviews={data.upcoming_interviews.map(i => ({ id: i.id, candidateName: i.candidate_name, position: i.position, stage: i.stage, initials: initials(i.candidate_name), time: new Date(i.scheduled_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }))} />
    </div>
  </>;
}
