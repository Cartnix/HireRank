export type JobStatus = "Открыта" | "На паузе" | "Закрыта";
export type Stage = "Отклик" | "Скрининг" | "Интервью" | "Оффер" | "Нанят" | "Отказ";
export type JobWorkMode = "Удалённо" | "Офис" | "Гибрид";
export type JobExperienceLevel = "Junior" | "Middle" | "Senior" | "Lead" | "Неважно";
export type JobPriority = "Низкий" | "Средний" | "Высокий";

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
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  workMode?: JobWorkMode;
  experienceLevel?: JobExperienceLevel;
  requiredSkills?: string[];
  openingsCount?: number | null;
  priority?: JobPriority;
  recruiter?: string;
  closingDate?: string;
}

export const DEFAULT_STAGES: Stage[] = ["Отклик", "Скрининг", "Интервью", "Оффер", "Нанят"];
export const allStages: Stage[] = ["Отклик", "Скрининг", "Интервью", "Оффер", "Нанят", "Отказ"];
