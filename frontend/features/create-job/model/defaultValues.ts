import type { JobFormValues } from "./JobSchema";

export const jobFormDefaults: JobFormValues = {
  title: "",
  department: "",
  location: "",
  employmentType: "Полная занятость",
  description: "",
  salaryMin: undefined,
  salaryMax: undefined,
  currency: "KZT",
  workMode: "Гибрид",
  experienceLevel: "Middle",
  requiredSkills: "",
  openingsCount: undefined,
  priority: "Средний",
  recruiter: "",
  closingDate: "",
};