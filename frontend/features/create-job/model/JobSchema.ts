import { z } from "zod";

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  });

export const jobFormSchema = z
  .object({
    title: z.string().trim().min(1, "Укажите название вакансии"),
    department: z.string().optional(),
    location: z.string().optional(),
    employmentType: z.string().default("Полная занятость"),
    description: z.string().optional(),
    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    currency: z.string().default("KZT"),
    workMode: z.enum(["Удалённо", "Офис", "Гибрид"]),
    experienceLevel: z.enum(["Junior", "Middle", "Senior", "Lead", "Неважно"]),
    requiredSkills: z.string().optional(),
    openingsCount: optionalNumber,
    priority: z.enum(["Низкий", "Средний", "Высокий"]),
    recruiter: z.string().optional(),
    closingDate: z.string().optional(),
  })
  .refine(
    (data) =>
      data.salaryMin == null ||
      data.salaryMax == null ||
      data.salaryMin <= data.salaryMax,
    {
      message: "«Зарплата до» не может быть меньше «от»",
      path: ["salaryMax"],
    },
  );

export type JobFormValues = z.infer<typeof jobFormSchema>;