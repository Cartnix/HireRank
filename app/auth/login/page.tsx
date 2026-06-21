"use client";

import { SubmitHandler, useForm } from "react-hook-form"

type LoginInput = {
    email: string;
    password: string;
    repeatPassword: string;
}

export const Login = () => {
    const { register, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>()
    const password = watch("password")

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
                    {...register("email",
                        {
                            required: "Email обязателен",
                            validate: (val) => val.endsWith("@tou.edu.kz") || "Доступ разрешен только по домену @tou.edu.kz"
                        })}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    type="password"
                    placeholder="Пароль"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    {...register("password", { required: "Пароль обязателен" })}
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    type="password"
                    placeholder="Повторите пароль"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    {...register("repeatPassword", {
                        required: "Повторите ваш пароль",
                        validate: (val) => val === password || "Пароли не совпадают"
                    })}
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