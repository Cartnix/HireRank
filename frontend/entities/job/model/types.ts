export type JobStatus = "Открыта" | "На паузе" | "Закрыта";
export type Stage = "Отклик" | "Скрининг" | "Интервью" | "Оффер" | "Нанят" | "Отказ";

export interface Job {
  id: string;
  title: string;
  department: string;
  status: JobStatus;
  createdAt: string;
  location: string;
  employmentType: string;
  description: string;
  stages: Stage[];
}

export const DEFAULT_STAGES: Stage[] = ["Отклик", "Скрининг", "Интервью", "Оффер", "Нанят"];
export const allStages: Stage[] = ["Отклик", "Скрининг", "Интервью", "Оффер", "Нанят", "Отказ"];
