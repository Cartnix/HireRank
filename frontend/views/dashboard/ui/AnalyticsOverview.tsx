"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/shared/ui/card";
import { HiringVelocityCard } from "@/widgets/candidates-grow/ui/CandidateVelocityChart";
import { HiringFunnelCard } from "@/widgets/candidate-funnel";
import { TopCandidatesCard } from "@/widgets/top-candidate";
import { UpcomingInterviewsCard } from "@/widgets/upcoming-interviews/ui/UpcomingInterviewsCard";
import type { DashboardAnalytics } from "@/widgets/dashboard-stats/model/analytics";

const colors = ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#fb7185"];
const funnelColors = ["bg-sky-400", "bg-indigo-400", "bg-violet-400", "bg-emerald-400"];
const funnelDefinitions = [
  { name: "Новые", aliases: ["новые", "новый", "отклик", "отклик получен", "без назначения"] },
  { name: "Скрининг", aliases: ["скрининг", "рассмотрение", "на рассмотрении"] },
  { name: "Собеседование", aliases: ["собеседование", "интервью", "технический этап"] },
  { name: "Оффер", aliases: ["оффер", "предложение"] },
  { name: "Принят", aliases: ["принят", "приняты", "нанят", "принят на работу"] },
];
const demoCandidates = [
  { id: "demo-anna", name: "Анна Смирнова", position: "Frontend-разработчик", stage: "Интервью", rating: 4.9, grade: "Senior", skills: ["React", "TypeScript", "Next.js"] },
  { id: "demo-mikhail", name: "Михаил Волков", position: "Backend-разработчик", stage: "Технический этап", rating: 4.8, grade: "Middle+", skills: ["Python", "FastAPI", "PostgreSQL"] },
  { id: "demo-alina", name: "Алина Ким", position: "Product Designer", stage: "Оффер", rating: 4.7, grade: "Senior", skills: ["Figma", "Research", "Design Systems"] },
];
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

function getFunnelStages(pipeline: DashboardAnalytics["pipeline"]) {
  const knownNames = new Set(funnelDefinitions.flatMap(({ aliases }) => aliases));
  const stages = funnelDefinitions.map(({ name, aliases }, index) => ({
    id: `standard-${index}`,
    name,
    count: pipeline.reduce(
      (total, stage) =>
        total + (aliases.includes(stage.stage.trim().toLocaleLowerCase("ru")) ? stage.count : 0),
      0,
    ),
    colorClass: funnelColors[index % funnelColors.length],
  }));
  const extraStages = pipeline
    .filter((stage) => !knownNames.has(stage.stage.trim().toLocaleLowerCase("ru")))
    .map((stage, index) => ({
      id: `custom-${index}`,
      name: stage.stage,
      count: stage.count,
      colorClass: funnelColors[(stages.length + index) % funnelColors.length],
    }));
  const max = Math.max(1, ...stages.map((stage) => stage.count), ...extraStages.map((stage) => stage.count));

  return [...stages, ...extraStages].map((stage) => ({
    ...stage,
    percentage: (stage.count / max) * 100,
  }));
}

export function AnalyticsOverview({
  data,
  candidateLink,
  demoMode = false,
}: {
  data: DashboardAnalytics;
  candidateLink?: (id: string) => string;
  demoMode?: boolean;
}) {
  const sourceTotal = data.sources.reduce((sum, source) => sum + source.count, 0);
  const hasSourceBreakdown = data.sources.length > 0 && sourceTotal >= 3;
  const candidates = data.top_candidates.length
    ? data.top_candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        position: candidate.position,
        stage: candidate.stage,
        rating: candidate.rating,
        initials: initials(candidate.name),
        stageColorClass: "border-blue-400/20 bg-blue-500/10 text-blue-300",
      }))
    : demoMode
      ? demoCandidates.map((candidate) => ({
          ...candidate,
          initials: initials(candidate.name),
          isMock: true,
          stageColorClass: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
        }))
      : [];
  return (
    <>
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card className="flex min-h-[340px] flex-col p-6 shadow-sm">
          <div className="mb-3">
          <h3 className="m-0 text-lg font-semibold text-foreground">Источники кандидатов</h3>
          <p className="mt-1 mb-0 text-sm text-muted-foreground">Откуда приходят лучшие специалисты</p>
        </div>
        {hasSourceBreakdown ? (
          <div className="grid min-h-[230px] flex-1 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-2">
            <div className="max-h-[240px] w-full space-y-3 overflow-y-auto">
              {data.sources.map((source, index) => (
                <div key={source.stage} className="flex min-w-0 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="truncate text-sm text-foreground-secondary">{source.stage}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{source.count}</span>
                    <span className="w-9 text-right text-xs text-muted-foreground">{Math.round((source.count / sourceTotal) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative h-full min-h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.sources} dataKey="count" nameKey="stage" innerRadius="58%" outerRadius="90%" paddingAngle={3} stroke="none">
                    {data.sources.map((source, index) => (
                      <Cell key={source.stage} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{sourceTotal}</span>
                <span className="text-xs text-muted-foreground">Всего</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="text-sm font-medium text-foreground-secondary">
              {sourceTotal ? "Данных пока недостаточно" : "Нет данных об источниках"}
            </span>
            <span className="text-xs text-muted-foreground">
              {sourceTotal ? `Получено кандидатов: ${sourceTotal}` : "Распределение появится после первых откликов"}
            </span>
          </div>
        )}
          </Card>
          <HiringVelocityCard data={data.candidate_trend} />
        </div>
        <HiringFunnelCard
          stages={getFunnelStages(data.pipeline)}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopCandidatesCard
          candidateLink={candidateLink}
          candidates={candidates}
        />
        <UpcomingInterviewsCard
          todayCount={data.todays_interviews}
          interviews={data.upcoming_interviews.map((i) => ({
            id: i.id,
            candidateName: i.candidate_name,
            position: i.position,
            stage: i.stage,
            initials: initials(i.candidate_name),
            time: new Date(i.scheduled_at).toLocaleString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))}
        />
      </div>
    </>
  );
}
