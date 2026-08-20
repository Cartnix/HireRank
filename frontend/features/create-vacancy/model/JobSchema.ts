import { z } from "zod";

export const jobFormSchema = z.object({
  title: z.string().trim().min(1, "Укажите название вакансии"),
  status: z.literal("draft").default("draft"),
  department: z.string().trim().min(1, "Укажите отдел"),
  description: z.string().trim(),
  requirements: z.string().trim(),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;