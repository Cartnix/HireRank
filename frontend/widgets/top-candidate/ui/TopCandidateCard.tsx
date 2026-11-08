"use client";

import Link from "next/link";
import { Card } from "@/shared/ui/card";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import type { TopCandidate } from "../model/top-candidate.mock";

export function TopCandidatesCard({ candidates, candidateLink = id => `/dashboard/candidates/${id}` }: { candidates: TopCandidate[]; candidateLink?: (id: string) => string }) {
  return (
    <Card className="flex min-h-[360px] flex-col bg-[#0e1726]/80 p-6 border-white/[0.08] shadow-none">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-lg font-semibold tracking-tight text-white">
            Топ кандидаты
          </h3>
          <p className="mt-1 mb-0 text-sm text-slate-400">
            Кандидаты с высокой оценкой интервьюера
          </p>
        </div>

        <Link href="/dashboard/candidates" className="flex items-center gap-1 pt-1 text-xs font-medium text-blue-400 transition-all hover:underline">
          <span>Все кандидаты</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {candidates.some((candidate) => candidate.isMock) && (
        <span className="mb-3 w-fit rounded-full border border-blue-400/15 bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-blue-300">
          Пример данных
        </span>
      )}

      {candidates.length ? (
        <div className="space-y-3">
          {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#0b121e] p-3.5 transition-colors hover:border-white/[0.12]"
          >
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-sm font-semibold text-blue-300">
                  {candidate.initials}
                </div>

                <div className="min-w-0">
                  <h4 className="m-0 truncate text-sm font-semibold leading-tight text-slate-100">
                    {candidate.isMock ? candidate.name : <Link href={candidateLink(candidate.id)}>{candidate.name}</Link>}
                  </h4>
                  <p className="mt-1 mb-0 truncate text-xs text-slate-400">{candidate.position}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {candidate.grade && <span className="rounded-lg border border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-300">{candidate.grade}</span>}
                <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${candidate.stageColorClass}`}>
                  {candidate.stage}
                </span>

                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-xs font-bold text-slate-100">{candidate.rating} / 5</span>
                </div>
              </div>
            </div>
            {candidate.skills?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => <span key={skill} className="rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400">{skill}</span>)}
              </div>
            ) : null}
          </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 rounded-full border border-white/[0.08] bg-white/[0.03] p-3 text-slate-500"><Users className="h-5 w-5" /></div>
          <p className="mb-1 text-sm font-medium text-slate-200">Пока нет оценённых кандидатов</p>
          <p className="m-0 text-xs text-slate-500">Добавьте кандидатов, чтобы видеть лучших в этом списке</p>
        </div>
      )}
    </Card>
  );
}