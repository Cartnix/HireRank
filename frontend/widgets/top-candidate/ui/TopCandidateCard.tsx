"use client";

import Link from "next/link";
import { Card } from "@/shared/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";
import type { TopCandidate } from "../model/top-candidate.mock";

export function TopCandidatesCard({ candidates, candidateLink = id => `/dashboard/candidates/${id}` }: { candidates: TopCandidate[]; candidateLink?: (id: string) => string }) {
  return (
    <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between h-full">
      {!candidates.length && <p className="text-sm text-muted-foreground">Оценок кандидатов пока нет</p>}
      {/* Шапка карточки */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight m-0">
            Топ кандидаты
          </h3>
          <p className="text-sm text-foreground-secondary mt-0.5 mb-0">
            Кандидаты с высокой оценкой интервьюера
          </p>
        </div>

        <Link href="/dashboard/candidates" className="flex items-center gap-1 text-xs font-medium text-cyan-main hover:underline transition-all pt-1">
          <span>Все кандидаты</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Список топ-кандидатов */}
      <div className="space-y-3.5 my-auto">
        {candidates.map((candidate) => (
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
                  <Link href={candidateLink(candidate.id)}>{candidate.name}</Link>
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
                <span className="text-xs font-bold text-foreground">{candidate.rating} / 5</span>
                <span className="text-[10px] text-foreground-secondary">оценка</span>
              </div>


            </div>
          </div>
        ))}
      </div>

      {/* Футер */}
      <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-secondary">
        <span>Средняя оценка по сохранённым отзывам</span>
      </div>
    </Card>
  );
}