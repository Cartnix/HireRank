import { DEFAULT_STAGES, type Job } from "@/entities/job";
import type { JobFormValues } from "./JobSchema";

export function mapFormToJob(values: JobFormValues): Job {
  return {
    id: `j${Date.now()}`,
    title: values.title.trim(),
    department: values.department?.trim() || "—",
    status: "Открыта",
    createdAt: new Date().toISOString().slice(0, 10),
    location: values.location?.trim() || "—",
    employmentType: values.employmentType.trim() || "Полная занятость",
    description: values.description?.trim() || "Описание пока не добавлено.",
    stages: DEFAULT_STAGES,
    salaryMin: values.salaryMin ?? null,
    salaryMax: values.salaryMax ?? null,
    currency: values.currency.trim() || "KZT",
    workMode: values.workMode,
    experienceLevel: values.experienceLevel,
    requiredSkills: (values.requiredSkills ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    openingsCount: values.openingsCount ?? null,
    priority: values.priority,
    recruiter: values.recruiter?.trim() || undefined,
    closingDate: values.closingDate || undefined,
  };
}