import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormSchema, type JobFormValues } from "./JobSchema";
import type { Job } from "@/entities/job";
import { jobFormDefaults } from "./defaultValues";
import { mapFormToJob } from "./mapFormToJob";

export function useNewJobForm(onCreate: (job: Job) => void) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: jobFormDefaults,
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit((values) => {
    onCreate(mapFormToJob(values));
  });

  return { ...form, onSubmit };
}