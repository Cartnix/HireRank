import { z } from "zod";

export const JOB_STATUSES = ["draft", "open"] as const;

export const JOB_STATUS_LABELS: Record<(typeof JOB_STATUSES)[number], string> =
  {
    draft: "Черновик",
    open: "Опубликована",
  };

export const LOCATIONS = ["Удалённо", "Офис", "Гибрид"] as const;

export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "internship",
] as const;

export const EMPLOYMENT_TYPE_LABELS: Record<
  (typeof EMPLOYMENT_TYPES)[number],
  string
> = {
  "full-time": "Полная занятость",
  "part-time": "Частичная занятость",
  internship: "Стажировка",
};

export const jobFormSchema = z
  .object({
    title: z.string().trim().min(1, "Укажите название вакансии"),
    status: z.enum(JOB_STATUSES).default("open"),
    department: z.string().trim().min(1, "Укажите отдел"),
    description: z.string().trim(),
    requirements: z
      .array(z.string().trim().min(1, "Требование не может быть пустым"))
      .min(1, "Укажите хотя бы одно требование"),

    location: z.enum(LOCATIONS).optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
    salaryMin: z.number().int().positive().nullable().optional(),
    salaryMax: z.number().int().positive().nullable().optional(),
    recruiter: z.string().trim().optional(),
    experience: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      data.salaryMin == null ||
      data.salaryMax == null ||
      data.salaryMin <= data.salaryMax,
    {
      message: "Мин. зарплата не может быть больше максимальной",
      path: ["salaryMax"],
    },
  );

export type JobFormValues = z.infer<typeof jobFormSchema>;
