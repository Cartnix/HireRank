import type { CreateVacancyPayload } from "@/entities/job";
import type { JobFormValues } from "./JobSchema";

export function mapFormToJob(values: JobFormValues): CreateVacancyPayload {
  return {
    title: values.title.trim(),
    department: values.department.trim(),
    description: values.description.trim(),
    requirements: values.requirements,
    status: values.status,
    location: values.location || undefined,
    employmentType: values.employmentType || undefined,
    salaryMin: values.salaryMin ?? null,
    salaryMax: values.salaryMax ?? null,
    recruiter: values.recruiter?.trim() || undefined,
    experience: values.experience?.trim() || undefined,
  };
}
