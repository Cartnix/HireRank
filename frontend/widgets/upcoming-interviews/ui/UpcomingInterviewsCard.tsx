import { Card } from "@/shared/ui/card";
import { upcomingInterviews } from "../model/upcomingInterviews.mock";
import { Calendar, Clock, Video } from "lucide-react";

export function UpcomingInterviewsCard() {
  return (
    <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between h-full">
      {/* Шапка карточки */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight m-0">
            Ближайшие собеседования
          </h3>
          <p className="text-sm text-foreground-secondary mt-0.5 mb-0">
            Запланированные встречи на сегодня
          </p>
        </div>
      </div>

      {/* Список собеседований */}
      <div className="space-y-4 my-auto">
        {upcomingInterviews.map((interview) => (
          <div
            key={interview.id}
            className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/50 hover:border-border transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Аватар с инициалами */}
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary font-semibold flex items-center justify-center text-sm border border-brand-primary/20">
                {interview.initials}
              </div>

              {/* Информация о кандидате */}
              <div>
                <h4 className="text-sm font-semibold text-foreground m-0 leading-tight">
                  {interview.candidateName}
                </h4>
                <p className="text-xs text-foreground-secondary mt-0.5 mb-0">
                  {interview.position}
                </p>
              </div>
            </div>

            {/* Время и кнопка подключения */}
            <div className="text-right flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                  <Clock className="w-3.5 h-3.5 text-foreground-secondary" />
                  {interview.time}
                </div>
                <span className="inline-block text-[11px] text-cyan-main mt-0.5">
                  {interview.stage}
                </span>
              </div>

              <button
                title="Подключиться к звонку"
                className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-brand-primary-foreground transition-all"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Футер карточки с общим статусом */}
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-foreground-secondary">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-cyan-main" />
          <span>
            Всего на сегодня: <strong>3 собеседования</strong>
          </span>
        </div>
        <span className="text-success font-medium">Система готова</span>
      </div>
    </Card>
  );
}
