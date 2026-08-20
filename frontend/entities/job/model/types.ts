export type JobStatus = "draft";
export type Stage = "Отклик" | "Скрининг" | "Интервью" | "Оффер" | "Нанят" | "Отказ";

export interface Job {
  id: string;
  title: string;
  department: string;
  status: JobStatus;
  description: string;
  requirements: string[];
}

export const allStages: Stage[] = ["Отклик", "Скрининг", "Интервью", "Оффер", "Нанят", "Отказ"];