import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormSchema, type JobFormValues } from "./JobSchema";
import {
  createVacancy,
  type CreateVacancyPayload,
  type Job,
} from "@/entities/job";
import { jobFormDefaults } from "./defaultValues";
import { mapFormToJob } from "./mapFormToJob";

export function useNewJobForm(
  onCreate?: (job: Job) => void,
  createJob: (payload: CreateVacancyPayload) => Promise<Job> = createVacancy,
) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: jobFormDefaults,
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = mapFormToJob(values);
      const createdJob = await createJob(payload);
      onCreate?.(createdJob);
      form.reset();
    } catch (error) {
      console.error(error, "ОШибка");
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Не удалось создать вакансию",
      });
    }
  });

  return { ...form, onSubmit, isSubmitting: form.formState.isSubmitting };
}
