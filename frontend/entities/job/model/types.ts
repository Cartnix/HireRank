export type JobStatus = "draft";
export type Stage =
  | "Отклик"
  | "Скрининг"
  | "Интервью"
  | "Оффер"
  | "Нанят"
  | "Отказ";

export interface Job {
  id: string;
  title: string;
  department: string;
  status: JobStatus;
  description: string;
  requirements: string[];

  // Необязательные поля — бэк их пока не принимает/не возвращает
  createdAt?: string;
  stages?: Stage[];
  location?: "Удалённо" | "Офис" | "Гибрид";
  employmentType?: "full-time" | "part-time" | "internship";
  salaryMin?: number | null;
  salaryMax?: number | null;
  recruiter?: string;
}

export const DEFAULT_STAGES: Stage[] = [
  "Отклик",
  "Скрининг",
  "Интервью",
  "Оффер",
  "Нанят",
  "Отказ",
];

export const allStages = DEFAULT_STAGES;