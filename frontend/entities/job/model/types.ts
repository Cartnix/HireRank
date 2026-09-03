export type JobStatus = "draft";

export interface Stage {
  id: string;
  stage_name: string;
  sort_order: number;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  status: JobStatus;
  description: string;
  requirements: string[];

  createdAt?: string;
  stages?: Stage[];
  location?: "Удалённо" | "Офис" | "Гибрид";
  employmentType?: "full-time" | "part-time" | "internship";
  salaryMin?: number | null;
  salaryMax?: number | null;
  recruiter?: string;
}

export const DEFAULT_STAGE_NAMES = [
  "Отклик",
  "Скрининг",
  "Интервью",
  "Оффер",
  "Нанят",
  "Отказ",
] as const;

export const DEFAULT_STAGES: Stage[] = DEFAULT_STAGE_NAMES.map((name, i) => ({
  id: name,
  stage_name: name,
  sort_order: i,
}));

export const allStages = DEFAULT_STAGES;