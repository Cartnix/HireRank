import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormSchema, type JobFormValues } from "./JobSchema";
import { createVacancy, type Job } from "@/entities/job";
import { jobFormDefaults } from "./defaultValues";
import { mapFormToJob } from "./mapFormToJob";

export function useNewJobForm(onCreate?: (job: Job) => void) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: jobFormDefaults,
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = mapFormToJob(values);
      const createdJob = await createVacancy(payload);
      onCreate?.(createdJob);
      form.reset();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error ? error.message : "Не удалось создать вакансию",
      });
    }
  });

  return { ...form, onSubmit, isSubmitting: form.formState.isSubmitting };
}