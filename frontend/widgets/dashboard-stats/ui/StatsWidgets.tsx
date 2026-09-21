import type { DashboardStats } from "@/views/dashboard"; 
import { getTrendBadge } from "@/shared/ui/badges/PercentageBadge";
import { Card } from "@/shared/ui/card";
import { getDeltaPercent } from "@/shared/utils/percent";
import { Briefcase, Users, CalendarDays, Clock } from "lucide-react";

interface StatsWidgetsProps extends DashboardStats {
  previousMonth?: DashboardStats;
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
    ? getDeltaPercent(todaysInterviewsCount, previousMonth.todaysInterviewsCount)
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
      <Card icon={Briefcase} badge={activeJobsBadge} className="p-6">
        <div className="text-[32px] font-bold leading-none tracking-tight">
          {activeJobsCount}
        </div>
        <div className="mt-2 text-sm text-foreground-secondary font-medium">
          Активные вакансии
        </div>
      </Card>

      <Card icon={Users} badge={candidatesBadge} className="p-6">
        <div className="text-[32px] font-bold leading-none tracking-tight">
          {inProgressCandidates}
        </div>
        <div className="mt-2 text-sm text-foreground-secondary font-medium">
          Всего кандидатов
        </div>
      </Card>

      <Card icon={CalendarDays} badge={interviewsBadge} className="p-6">
        <div className="text-[32px] font-bold leading-none tracking-tight">
          {todaysInterviewsCount}
        </div>
        <div className="mt-2 text-sm text-foreground-secondary font-medium">
          Назначено собеседований
        </div>
      </Card>

      <Card icon={Clock} badge={timeToHireBadge} className="p-6">
        <div className="text-[32px] font-bold leading-none tracking-tight">
          {avgTimeToHire} дн.
        </div>
        <div className="mt-2 text-sm text-foreground-secondary font-medium">
          Среднее время для найма
        </div>
      </Card>
    </div>
  );
}