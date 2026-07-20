import { Stage } from "@/entities/job";
import { Card } from "@/shared/ui/Card";

export const funnelStages: { stage: Stage; count: number }[] = [
  { stage: "Отклик", count: 46 },
  { stage: "Скрининг", count: 28 },
  { stage: "Интервью", count: 15 },
  { stage: "Оффер", count: 6 },
  { stage: "Нанят", count: 4 },
];

export function ConversionFunnel() {
  const maxFunnel = Math.max(...funnelStages.map((f) => f.count));

  return (
    <Card className="p-6">
      <div className="mb-1 text-[15px] font-semibold">Воронка конверсии</div>
      <div className="mb-5 text-[12.5px] text-foreground-secondary">Где чаще всего отсеиваются кандидаты</div>
      <div className="space-y-4">
        {funnelStages.map((f, idx) => {
          const prev = idx > 0 ? funnelStages[idx - 1].count : f.count;
          const conv = idx > 0 ? Math.round((f.count / prev) * 100) : 100;
          return (
            <div key={f.stage}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-medium">{f.stage}</span>
                <span className="text-foreground-secondary">
                  {f.count} {idx > 0 && <span className="text-muted-foreground">({conv}%)</span>}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-primary"
                  style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
