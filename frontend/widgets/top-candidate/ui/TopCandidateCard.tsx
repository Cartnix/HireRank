"use client";

import { DemoBadge } from "@/shared/ui/badges/DemoBadge";
import { Card } from "@/shared/ui/card";
import { MoreHorizontal, ArrowRight, Sparkles } from "lucide-react";
import { topCandidatesMock } from "../model/top-candidate.mock";

export function TopCandidatesCard() {
  return (
    <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between h-full">
      <DemoBadge />
      {/* Шапка карточки */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight m-0">
            Топ кандидаты
          </h3>
          <p className="text-sm text-foreground-secondary mt-0.5 mb-0">
            Кандидаты с высоким AI-рейтингом, требующие внимания
          </p>
        </div>

        <button className="flex items-center gap-1 text-xs font-medium text-cyan-main hover:underline transition-all pt-1">
          <span>Все кандидаты</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Список топ-кандидатов */}
      <div className="space-y-3.5 my-auto">
        {topCandidatesMock.map((candidate) => (
          <div
            key={candidate.id}
            className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/50 hover:border-border transition-all"
          >
            <div className="flex min-w-0 items-center gap-3.5">
              {/* Аватар с инициалами */}
              <div className="w-10 h-10 shrink-0 rounded-xl bg-cyan-main/10 text-cyan-main font-semibold flex items-center justify-center text-sm border border-cyan-main/20">
                {candidate.initials}
              </div>

              {/* Имя и специальность */}
              <div>
                <h4 className="text-sm font-semibold text-foreground m-0 leading-tight">
                  {candidate.name}
                </h4>
                <p className="text-xs text-foreground-secondary mt-0.5 mb-0">
                  {candidate.position}
                </p>
              </div>
            </div>

            {/* Этап, AI Скор и меню */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${candidate.stageColorClass}`}>
                {candidate.stage}
              </span>

              <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border">
                <Sparkles className="w-3.5 h-3.5 text-cyan-main" />
                <span className="text-xs font-bold text-foreground">{candidate.aiScore}</span>
                <span className="text-[10px] text-foreground-secondary">score</span>
              </div>

              <button className="text-foreground-secondary hover:text-foreground transition-colors p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Футер */}
      <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-secondary">
        <span>Ранжирование выполнено нейросетью HireAI</span>
        <span className="text-success font-medium">Обновлено только что</span>
      </div>
    </Card>
  );
}