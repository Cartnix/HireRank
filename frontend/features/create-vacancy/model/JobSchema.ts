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
    title: z.string().trim().min(1, "Укажите название вакансии (например, Доцент кафедры ИТ)"),

    location: z.string().trim(),
    
    staffCategory: z.enum([
      "ППС (Профессорско-преподавательский состав)",
      "Учебно-вспомогательный персонал (УВП)",
      "Научные сотрудники",
      "Административно-управленческий персонал (АУП)",
      "АХП (Хозяйственный и обслуживающий персонал)"
    ]),

    department: z.string().min(1, "Укажите кафедру, департамент или отдел"),
    
    employmentType: z.enum([
      "Полная ставка (1.0)",
      "0.75 ставки",
      "0.5 ставки",
      "0.25 ставки",
      "Почасовая оплата",
      "Совместительство"
    ]).default("Полная ставка (1.0)"),

    workMode: z.enum(["Офис (в университете)", "Удалённо", "Гибрид"]),
    
    description: z.string().optional(),
    
    academicDegree: z.enum([
      "Не требуется",
      "Магистр",
      "Кандидат наук / PhD",
      "Доктор наук"
    ]).default("Не требуется"),

    experienceLevel: z.enum([
      "Без опыта",
      "1–3 года",
      "3–6 лет",
      "Более 6 лет",
      "Неважно"
    ]),

    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    currency: z.string().default("KZT"),

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