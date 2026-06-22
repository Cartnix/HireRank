"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form"
import z, { email } from "zod";

const LogInSchema = z.object({
    email: z.string().email("Некорректный email").endsWith("@tou.edu.kz", "Доступ только по домену @tou.edu.kz"),
    password: z.string().min(8, "Пароль должен состоять минимум из 8 символов"),
    repeatPassword: z.string()
}).refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"]
})

type LoginInput = z.infer<typeof LogInSchema>;

export const Login = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
        resolver: zodResolver(LogInSchema)
    })

    const onSubmit: SubmitHandler<LoginInput> = (data) => { console.log("Данные отправлены: ", data) }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col gap-4"
        >
            <h2 className="text-xl font-bold text-gray-800">Регистрация</h2>

            <div className="flex flex-col gap-1">
                <input
                    type="email"
                    placeholder="Email"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    type="password"
                    placeholder="Пароль"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    {...register("password")}
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    type="password"
                    placeholder="Повторите пароль"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    {...register("repeatPassword")}
                />
                {errors.repeatPassword && <p className="text-red-500 text-sm">{errors.repeatPassword.message}</p>}
            </div>

            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Отправка..." : "Регистрация"}
            </button>
        </form>
    )
}