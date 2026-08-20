import type { Job } from "@/entities/job";
import type { JobFormValues } from "./JobSchema";

export function mapFormToJob(values: JobFormValues): Job {
  return {
    id: `j${Date.now()}`,
    title: values.title.trim(),
    status: values.status,
    department: values.department.trim(),
    description: values.description.trim(),
    requirements: values.requirements
      .split(",")
      .flatMap((requirement) => requirement.split("\n"))
      .map((requirement) => requirement.trim())
      .filter(Boolean),
  };
}