import { Stage } from "@/entities/job/model/types";

const stageColor: Record<Stage, string> = {
  Отклик: "bg-muted text-muted-foreground",
  Скрининг: "bg-brand-primary/10 text-brand-primary",
  Интервью: "bg-warning/15 text-warning",
  Оффер: "bg-success/15 text-success",
  Нанят: "bg-success/20 text-success",
  Отказ: "bg-danger/10 text-danger",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ${stageColor[stage]}`}>
      {stage}
    </span>
  );
}
