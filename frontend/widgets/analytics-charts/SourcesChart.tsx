import { Card } from "@/shared/ui/Card";

export const sourcesData = [
  { label: "LinkedIn", value: 38 },
  { label: "Реферальная программа", value: 27 },
  { label: "HH.ru", value: 18 },
  { label: "Карьерный сайт", value: 12 },
  { label: "Агентства", value: 5 },
];

export function SourcesChart() {
  const maxSource = Math.max(...sourcesData.map((s) => s.value));

  return (
    <Card className="p-6">
      <div className="mb-1 text-[15px] font-semibold">Источники кандидатов</div>
      <div className="mb-5 text-[12.5px] text-foreground-secondary">Откуда приходят отклики</div>
      <div className="space-y-4">
        {sourcesData.map((s) => (
          <div key={s.label}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="font-medium">{s.label}</span>
              <span className="text-foreground-secondary">{s.value}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${(s.value / maxSource) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
