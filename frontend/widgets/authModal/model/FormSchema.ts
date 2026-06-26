import { z } from "zod";

export const FormValues = z.object({
    email: z.string().email('Неверный email').refine((v) => v.endsWith('@tou.edu.kz'), {
        message: 'Email должен заканчиваться на @tou.edu.kz',
    }),
    password: z.string().min(8, 'Пароль должен состоять минимум из 8 символов'),
    repeatPassword: z.string()
}).refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"],
});