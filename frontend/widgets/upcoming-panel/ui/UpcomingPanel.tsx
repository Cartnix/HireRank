import { CheckCircle2 } from "lucide-react";
import { Candidate } from "@/entities/candidate";
import { Job } from "@/entities/job";
import { Interview } from "@/entities/interview";
import { Card } from "@/shared/ui/Card";
import { Avatar } from "@/shared/ui/Avatar";

const tasks = [
  { text: "Отправить оффер — Мадина Оспанова", tag: "Оффер" },
  { text: "Оставить фидбэк по интервью — Артём Волков", tag: "Фидбэк" },
  { text: "Согласовать зарплату — Гульнара Есенова", tag: "Согласование" },
];

export function UpcomingPanel({
  todaysInterviews,
  candidateById,
  jobById,
}: {
  todaysInterviews: Interview[];
  candidateById: Record<string, Candidate>;
  jobById: Record<string, Job>;
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[15px] font-semibold">To-Do</div>
      </div>

      <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        Ближайшие интервью
      </div>
      <div className="mb-4 space-y-2.5">
        {todaysInterviews.map((iv) => {
          const cand = candidateById[iv.candidateId];
          return (
            <div key={iv.id} className="flex items-center gap-2.5">
              <Avatar name={cand.name} size={28} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{cand.name}</div>
                <div className="text-[12px] text-foreground-secondary">
                  {iv.startHour}:00 · {jobById[cand.jobId]?.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Задачи</div>
      <div className="space-y-2.5">
        {tasks.map((t, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[13px]">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
            <span className="text-foreground-secondary">{t.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
