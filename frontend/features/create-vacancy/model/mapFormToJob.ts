import type { CreateVacancyPayload, Job } from "@/entities/job";
import type { JobFormValues } from "./JobSchema";

export function mapFormToJob(values: JobFormValues): CreateVacancyPayload {
  return {
    title: values.title.trim(),
    department: values.department.trim(),
    description: values.description.trim(),
    requirements: values.requirements,
  };
}