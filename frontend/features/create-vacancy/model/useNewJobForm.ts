import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormSchema, type JobFormValues } from "./JobSchema";
import type { Job } from "@/entities/job";
import { jobFormDefaults } from "./defaultValues";
import { mapFormToJob } from "./mapFormToJob";
import { apiFetch } from "@/shared/api/client";
import { me } from "@/shared/api/auth";

export async function AddNewVacancy(jobData: Job) {
  const data = await apiFetch<Job>("/vacancies/", {
    method: "POST",
    json: jobData,
  });

  await me();
  return data;
}

export function useNewJobForm(onCreate?: (job: Job) => void) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: jobFormDefaults,
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const mappedJob = mapFormToJob(values);
      const createdJob = await AddNewVacancy(mappedJob);
      onCreate?.(createdJob);

      form.reset();
    } catch (error) {
      console.log("ОШибка при создании вакансии");
    }
  });

  return { ...form, onSubmit, isSubmitting: form.formState.isSubmitting };
}
