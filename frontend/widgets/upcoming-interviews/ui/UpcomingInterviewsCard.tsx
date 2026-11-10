import { Card } from "@/shared/ui/card";
import type { Interview } from "../model/upcomingInterviews.mock";
import Link from "next/link";
import { Calendar, CalendarPlus, Clock } from "lucide-react";

export function UpcomingInterviewsCard({ interviews, todayCount }: { interviews: Interview[]; todayCount: number }) {
  return (
    <Card className="flex min-h-[360px] flex-col p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-lg font-semibold tracking-tight text-foreground">
            Ближайшие собеседования
          </h3>
          <p className="mt-1 mb-0 text-sm text-muted-foreground">
            Ближайшие запланированные встречи
          </p>
        </div>
      </div>

      {interviews.length ? (
        <div className="space-y-3">
          {interviews.map((interview) => (
          <div
            key={interview.id}
            className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-background p-3.5 transition-colors hover:border-brand-primary/30 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10 text-sm font-semibold text-violet-300">
                {interview.initials}
              </div>

              <div className="min-w-0">
                <h4 className="m-0 truncate text-sm font-semibold leading-tight text-foreground">
                  {interview.candidateName}
                </h4>
                <p className="mt-1 mb-0 truncate text-xs text-muted-foreground">
                  {interview.position}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:text-right">
              <div className="sm:text-right">
                <div className="flex items-center gap-1 text-xs font-medium text-foreground-secondary">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {interview.time}
                </div>
                <span className="mt-1 inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-300">
                  {interview.stage}
                </span>
              </div>
            </div>
          </div>
          ))}
          <div className="mt-auto flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span>Сегодня: <strong className="font-semibold text-foreground">{todayCount}</strong></span>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 rounded-full border border-border bg-muted p-4 text-muted-foreground">
            <Calendar className="h-6 w-6" strokeWidth={1.6} />
          </div>
          <h4 className="mb-1 text-sm font-semibold text-foreground">Нет запланированных встреч</h4>
          <p className="mb-4 mt-0 text-xs text-muted-foreground">Добавьте собеседование, чтобы спланировать следующий этап найма</p>
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs font-medium text-foreground-secondary transition-colors hover:border-brand-primary/30 hover:bg-accent hover:text-accent-foreground"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            + Назначить собеседование
          </Link>
        </div>
      )}
    </Card>
  );
}
