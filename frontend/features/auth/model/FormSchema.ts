import { z } from "zod";

const emailSchema = z.string().email("Неверный email");
const passwordSchema = z
  .string()
  .min(8, "Пароль должен состоять минимум из 8 символов");

export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = loginFormSchema.extend({
  repeatPassword: passwordSchema,
}).refine((data) => data.password === data.repeatPassword, {
  message: "Пароли не совпадают",
  path: ["repeatPassword"],
});

export type LoginFormValuesType = z.infer<typeof loginFormSchema>;
export type RegisterFormValuesType = z.infer<typeof registerFormSchema>;
