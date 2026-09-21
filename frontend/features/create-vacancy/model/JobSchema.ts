import { z } from "zod";

export const JOB_STATUSES = ["draft", "open"] as const;

export const JOB_STATUS_LABELS: Record<(typeof JOB_STATUSES)[number], string> = {
  draft: "Черновик",
  open: "Опубликована",
};

export const jobFormSchema = z.object({
  title: z.string().trim().min(1, "Укажите название вакансии"),
  status: z.enum(JOB_STATUSES).default("draft"),
  department: z.string().trim().min(1, "Укажите отдел"),
  description: z.string().trim(),
  requirements: z
    .array(z.string().trim().min(1, "Требование не может быть пустым"))
    .min(1, "Укажите хотя бы одно требование"),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;