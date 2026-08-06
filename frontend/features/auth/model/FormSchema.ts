import { z } from "zod";

const emailSchema = z.string().email("Неверный email");
const passwordSchema = z.string().min(8, "Минимум 8 символов");

export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = loginFormSchema.extend({
  first_name: z.string().trim().min(1, "Укажите имя"),
  last_name: z.string().trim().min(1, "Укажите фамилию"),
  role: z.enum(["hr", "candidate"], {
    required_error: "Выберите роль",
  }),
  repeatPassword: passwordSchema,
}).refine((d) => d.password === d.repeatPassword, {
  message: "Пароли не совпадают",
  path: ["repeatPassword"],
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;