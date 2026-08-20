import type { JobFormValues } from "./JobSchema";

export const jobFormDefaults: JobFormValues = {
  title: "",
  staffCategory: "ППС (Профессорско-преподавательский состав)", 
  department: "",
  employmentType: "Полная ставка (1.0)",
  workMode: "Офис (в университете)", 
  location: "Павлодар",
  description: "",
  academicDegree: "Не требуется",
  experienceLevel: "Неважно",
  salaryMin: undefined,
  salaryMax: undefined,
  currency: "KZT",
  requiredSkills: "",
  openingsCount: undefined,
  priority: "Средний",
  recruiter: "",
  closingDate: "",
};