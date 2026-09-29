const stageColor: Record<string, string> = {
  "Новый": "bg-muted text-muted-foreground",
  "Без назначения": "bg-muted text-muted-foreground",
  "Назначен": "bg-brand-primary/10 text-brand-primary",
  "В работе": "bg-brand-primary/10 text-brand-primary",
  "Доп. рассмотрение": "bg-warning/15 text-warning",
  "Отклонён": "bg-danger/10 text-danger",
  "Отклонённые": "bg-danger/10 text-danger",
  Отклик: "bg-muted text-muted-foreground",
  Скрининг: "bg-brand-primary/10 text-brand-primary",
  Интервью: "bg-warning/15 text-warning",
  Оффер: "bg-success/15 text-success",
  Нанят: "bg-success/20 text-success",
  Отказ: "bg-danger/10 text-danger",
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ${stageColor[stage] ?? "bg-muted text-muted-foreground"}`}>
      {stage}
    </span>
  );
}