export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  colorClass: string; 
}

export const funnelStages: FunnelStage[] = [
  {
    id: "1",
    name: "Отклики",
    count: 248,
    percentage: 100,
    colorClass: "bg-cyan-main",
  },
  {
    id: "2",
    name: "AI-скрининг",
    count: 156,
    percentage: 63,
    colorClass: "bg-chart-1",
  },
  {
    id: "3",
    name: "Оценка коммитета",
    count: 72,
    percentage: 30,
    colorClass: "bg-warning",
  },
  {
    id: "4",
    name: "Пробная лекция",
    count: 28,
    percentage: 15,
    colorClass: "bg-success",
  },
  {
    id: "5",
    name: "Этап оффера",
    count: 9,
    percentage: 8,
    colorClass: "bg-chart-4",
  },
];