import { Card } from "@/shared/ui/card";
import type { FunnelStage } from "../model/candidate-funnel.mock";

export function HiringFunnelCard({ stages }: { stages: FunnelStage[] }) {
  return (
    <Card className="flex w-full flex-col border-white/[0.08] bg-[#0e1726]/80 p-6 shadow-none lg:col-span-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-lg font-semibold tracking-tight text-white">
            Воронка найма
          </h3>
          <p className="mt-1 mb-0 text-sm text-slate-400">
            Распределение кандидатов по этапам
          </p>
        </div>
      </div>

      {stages.length ? (
        <div className="space-y-2.5">
          <div className="hidden grid-cols-[minmax(140px,0.75fr)_minmax(0,2fr)_64px_120px] items-center gap-4 px-3 text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:grid">
            <span>Этап</span>
            <span>Объём кандидатов</span>
            <span className="text-right">Всего</span>
            <span className="text-right">Конверсия</span>
          </div>
          {stages.map((stage, index) => {
            const conversion = index === 0
              ? null
              : stages[index - 1].count === 0
                ? null
                : Math.round((stage.count / stages[index - 1].count) * 100);
            return (
              <div key={stage.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-white/[0.04] bg-[#0b121e]/60 px-3 py-2.5 lg:grid-cols-[minmax(140px,0.75fr)_minmax(0,2fr)_64px_120px] lg:gap-4">
                <span className="truncate text-sm font-medium text-slate-200">{stage.name}</span>
                <div className="col-span-2 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05] lg:col-span-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stage.colorClass}`}
                    style={{ width: `${stage.count === 0 ? 0 : Math.max(4, Math.min(100, stage.percentage))}%` }}
                  />
                </div>
                <span className="col-start-2 row-start-1 text-right text-sm font-semibold text-white lg:col-start-3">{stage.count || "N/A"}</span>
                <span className="col-span-2 text-right text-xs text-slate-500 lg:col-span-1 lg:col-start-4 lg:row-start-1">
                  {index === 0 ? "—" : conversion === null ? "N/A" : `${conversion}%`}
                  <span className="lg:hidden">{index > 0 ? " конверсия" : ""}</span>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
          Нет данных по этапам
        </div>
      )}
    </Card>
  );
}