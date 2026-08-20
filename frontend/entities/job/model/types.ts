export type JobStatus = "Открыта" | "На паузе" | "Закрыта";
export type Stage = "Отклик" | "Скрининг" | "Интервью" | "Оффер" | "Нанят" | "Отказ";

export type JobWorkMode = "Офис (в университете)" | "Удалённо" | "Гибрид";

export type StaffCategory = 
  | "ППС (Профессорско-преподавательский состав)"
  | "Учебно-вспомогательный персонал (УВП)"
  | "Научные сотрудники"
  | "Административно-управленческий персонал (АУП)"
  | "АХП (Хозяйственный и обслуживающий персонал)";

export type AcademicDegree = 
  | "Не требуется"
  | "Магистр"
  | "Кандидат наук / PhD"
  | "Доктор наук";

export type JobExperienceLevel = "Без опыта" | "1–3 года" | "3–6 лет" | "Более 6 лет" | "Неважно";
export type JobPriority = "Низкий" | "Средний" | "Высокий";

export interface Job {
  id: string;
  title: string;
  
  staffCategory?: StaffCategory;
  academicDegree?: AcademicDegree;

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