import { Card } from "@/shared/ui/Card";
import { Briefcase, Users, CalendarDays } from "lucide-react";

export function StatsWidgets({
  activeJobsCount,
  inProgressCandidates,
  todaysInterviewsCount,
}: {
  activeJobsCount: number;
  inProgressCandidates: number;
  todaysInterviewsCount: number;
}) {
  const widgets = [
    { label: "Активные вакансии", value: activeJobsCount, icon: Briefcase, tint: "text-brand-primary bg-brand-primary/10" },
    { label: "Кандидаты в работе", value: inProgressCandidates, icon: Users, tint: "text-success bg-success/10" },
    { label: "Встречи сегодня", value: todaysInterviewsCount, icon: CalendarDays, tint: "text-warning bg-warning/10" },
  ];

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      {widgets.map((w) => (
        <Card key={w.label} className="p-5">
          <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] ${w.tint}`}>
            <w.icon size={18} />
          </div>
          <div className="text-[28px] font-bold leading-none">{w.value}</div>
          <div className="mt-1.5 text-[13px] text-foreground-secondary">{w.label}</div>
        </Card>
      ))}
    </div>
  );
}
